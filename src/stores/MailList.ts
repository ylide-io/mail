import { EthereumBlockchainController } from '@ylide/ethereum';
import { EverscaleBlockchainController } from '@ylide/everscale';
import {
	AbstractBlockchainController,
	asyncDelay,
	BlockchainSourceType,
	IBlockchainSourceSubject,
	IGenericAccount,
	IMessage,
	IMessageWithSource,
	ISourceWithMeta,
	ListSource,
	ListSourceDrainer,
	ListSourceMultiplexer,
	SourceReadingSession,
	Uint256,
	YLIDE_MAIN_FEED_ID,
} from '@ylide/sdk';
import { autobind } from 'core-decorators';
import { computed, makeAutoObservable, makeObservable, observable, transaction } from 'mobx';

import { VENOM_FEED_ID } from '../constants';
import messagesDB, { MessagesDB } from '../indexedDB/impl/MessagesDB';
import { IMessageDecodedContent } from '../indexedDB/IndexedDB';
import { invariant } from '../utils/assert';
import { formatAddress } from '../utils/blockchain';
import { decodeMessage } from '../utils/mail';
import { analytics } from './Analytics';
import { browserStorage } from './browserStorage';
import contacts from './Contacts';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';
import tags from './Tags';

export enum FolderId {
	Inbox = 'inbox',
	Sent = 'sent',
	Archive = 'archive',
}

export function getFolderName(folderId: FolderId) {
	if (folderId === FolderId.Inbox) {
		return 'Inbox';
	} else if (folderId === FolderId.Sent) {
		return 'Sent';
	} else if (folderId === FolderId.Archive) {
		return 'Archive';
	} else {
		const tag = tags.tags.find(t => String(t.id) === folderId);
		return tag?.name || 'Unknown';
	}
}

//

// const MailPageSize = 10;

const FILTERED_OUT = {};

function wrapMessageId(p: IMessageWithSource) {
	const acc = p.meta?.account as DomainAccount | undefined;
	return `${p.msg.msgId}${acc ? `:${acc.account.address}` : ''}`;
}

export interface ILinkedMessage {
	id: string;
	msgId: string;
	msg: IMessage;
	recipient: DomainAccount | null;
	recipients: string[];
	reader: AbstractBlockchainController;
}

export namespace ILinkedMessage {
	export function idFromIMessage(message: IMessage, account: DomainAccount) {
		return `${message.msgId}:${account.account.address}`;
	}

	export async function fromIMessage(
		folderId: FolderId | null,
		message: IMessage,
		account: DomainAccount,
	): Promise<ILinkedMessage> {
		const reader = domain.ylide.controllers.blockchainsMap[message.blockchain];

		let recipients: string[] = [];
		try {
			// console.log('folderId: ', folderId);
			if (folderId === FolderId.Sent) {
				recipients = (await (reader as EthereumBlockchainController).getMessageRecipients(
					message,
					true,
				))!.recipients.map(formatAddress);
			}
		} catch (e) {}

		return {
			id: idFromIMessage(message, account),
			msgId: message.msgId,
			msg: message,
			recipient: account,
			recipients,
			reader,
		};
	}

	export async function fromIMessageArray(
		folderId: FolderId | null,
		messages: IMessage[],
		account: DomainAccount,
	): Promise<ILinkedMessage[]> {
		return await Promise.all(messages.map(m => fromIMessage(folderId, m, account)));
	}

	//

	export function idFromIMessageWithSource(p: IMessageWithSource) {
		return idFromIMessage(p.msg, p.meta.account);
	}

	export async function fromIMessageWithSource(
		folderId: FolderId | null,
		p: IMessageWithSource,
	): Promise<ILinkedMessage> {
		return fromIMessage(folderId, p.msg, p.meta.account);
	}

	export async function fromIMessageWithSourceArray(
		folderId: FolderId | null,
		p: IMessageWithSource[],
	): Promise<ILinkedMessage[]> {
		return await Promise.all(p.map(m => fromIMessageWithSource(folderId, m)));
	}
}

export class MailList<M = ILinkedMessage> {
	private isDestroyed = false;

	public id: string;
	folderId: FolderId | null = null;

	@observable isNextPageAvailable = true;
	@observable isLoading = true;
	@observable isError = false;

	@observable.shallow public messagesData: { raw: IMessageWithSource; handled: M | typeof FILTERED_OUT }[] = [];
	@observable newMessagesCount: number = 0;

	private stream: ListSourceDrainer | undefined;
	private streamDisposer: (() => void) | undefined;

	private messagesFilter: ((messages: ILinkedMessage[]) => ILinkedMessage[] | Promise<ILinkedMessage[]>) | undefined;
	private messageHandler: ((message: ILinkedMessage) => M | Promise<M>) | undefined;

	constructor() {
		makeObservable(this);
		this.id = String(Math.floor(Math.random() * 1000000000));
		console.log('MailList created', this.id);
		// @ts-ignore
		window.activeMailList = this;
	}

	async init(props: {
		messagesFilter?: (messages: ILinkedMessage[]) => ILinkedMessage[] | Promise<ILinkedMessage[]>;
		messageHandler?: (message: ILinkedMessage) => M | Promise<M>;
		mailbox?: { accounts: DomainAccount[]; folderId: FolderId; sender?: string; filter?: (id: string) => boolean };
		venomFeed?: boolean;
	}) {
		// hotfix https://trello.com/c/sEtvpbrG
		await asyncDelay(100);

		const { messagesFilter, messageHandler, mailbox, venomFeed } = props;

		this.messagesFilter = messagesFilter;
		this.messageHandler = messageHandler;

		this.folderId = null;

		if (mailbox) {
			this.folderId = mailbox.folderId;

			function buildMailboxSources(): ISourceWithMeta[] {
				invariant(mailbox);

				function getDirectWithMeta(
					recipient: Uint256,
					sender: string | null,
					account: DomainAccount,
				): ISourceWithMeta[] {
					return domain.ylide.core
						.getListSources(mailStore.readingSession, [
							{
								feedId: YLIDE_MAIN_FEED_ID,
								type: BlockchainSourceType.DIRECT,
								recipient,
								sender,
							},
						])
						.map(source => ({ source, meta: { account } }));
					// .filter(s => s.source.subject.id === 'evm-GNOSIS-mailer-58');
				}

				if (mailbox.folderId === FolderId.Inbox || mailbox.folderId === FolderId.Archive) {
					return mailbox.accounts
						.map(acc => getDirectWithMeta(acc.uint256Address, mailbox.sender || null, acc))
						.flat();
				} else if (mailbox.folderId === FolderId.Sent) {
					return mailbox.accounts.map(acc => getDirectWithMeta(acc.sentAddress, null, acc)).flat();
				} else {
					const tag = tags.tags.find(t => String(t.id) === mailbox.folderId);
					if (!tag) {
						return [];
					}
					const contactsV = contacts.contacts.filter(c => c.tags.includes(tag.id));
					return contactsV
						.map(v => mailbox.accounts.map(acc => getDirectWithMeta(acc.uint256Address, v.address, acc)))
						.flat()
						.flat();
				}
			}

			this.stream = new ListSourceDrainer(new ListSourceMultiplexer(buildMailboxSources()));
			const start = Date.now();
			// debugger;
			const { dispose } = await this.stream.connect('Mailer', this.onNewMessages);
			console.log('MailList init', this.id, Date.now() - start);
			this.streamDisposer = dispose;
			await this.stream.resetFilter(m => {
				return mailbox.filter ? mailbox.filter(wrapMessageId(m)) : true;
			});
			await this.reloadMessages();
		} else if (venomFeed) {
			async function buildVenomFources(): Promise<ISourceWithMeta[]> {
				invariant(venomFeed);

				const blockchainController = domain.blockchains['venom-testnet'] as EverscaleBlockchainController;
				const composedFeedId = await blockchainController.getComposedFeedId(VENOM_FEED_ID, 1);
				const blockchainSubject: IBlockchainSourceSubject = {
					feedId: composedFeedId,
					type: BlockchainSourceType.BROADCAST,
					sender: null,
					blockchain: 'venom-testnet',
					id: 'tvm-venom-testnet-broadcaster-14',
				};
				const originalSource = blockchainController.ininiateMessagesSource(blockchainSubject);
				const listSource = new ListSource(mailStore.readingSession, blockchainSubject, originalSource);

				return [
					{
						source: listSource,
					},
				];
			}

			this.stream = new ListSourceDrainer(new ListSourceMultiplexer(await buildVenomFources()));
			const start = Date.now();
			const { dispose } = await this.stream.connect('Mailer', this.onNewMessages);
			console.log('MailList init', this.id, Date.now() - start);
			this.streamDisposer = dispose;
			await this.reloadMessages();
		} else {
			throw new Error('Cannot init list sources');
		}

		if (this.isDestroyed) return;
	}

	@computed
	get messages() {
		return this.messagesData.filter(m => m.handled !== FILTERED_OUT).map(m => m.handled as M);
	}

	private async handleMessages() {
		const newMessages = this.stream!.messages.filter(
			m => !this.messagesData.find(old => old.raw.msg.msgId === m.msg.msgId),
		);
		const newLinked = await ILinkedMessage.fromIMessageWithSourceArray(this.folderId, newMessages);
		const newFiltered = this.messagesFilter ? await this.messagesFilter(newLinked) : newLinked;

		return await Promise.all(
			this.stream!.messages.map(async raw => {
				// Message is processed already
				const existing = this.messagesData.find(e => e.raw.msg.msgId === raw.msg.msgId);
				if (existing) {
					return existing;
				}

				// Message is filtered out
				const linked = newLinked.find(nl => nl.msgId === raw.msg.msgId)!;
				if (!newFiltered.includes(linked)) {
					return {
						raw,
						handled: FILTERED_OUT,
					};
				}

				// Message should be processed and saved
				return {
					raw,
					handled: this.messageHandler ? await this.messageHandler(linked) : (linked as M),
				};
			}),
		);
	}

	@autobind
	private async onNewMessages() {
		this.newMessagesCount = this.stream!.newMessagesCount || 0;
	}

	async drainNewMessages() {
		await this.stream?.drainNewMessages();
		const data = await this.handleMessages();
		transaction(() => {
			this.messagesData = data;
			this.isNextPageAvailable = !this.stream?.readToBottom;
			this.newMessagesCount = this.stream!.newMessagesCount || 0;
		});
	}

	async reloadMessages() {
		invariant(this.stream, 'Mail list not ready yet');
		invariant(!this.isDestroyed, 'Mail list destroyed already');

		this.isLoading = true;

		try {
			const data = await this.handleMessages();
			transaction(() => {
				this.messagesData = data;
				this.isNextPageAvailable = !this.stream?.readToBottom;
				this.isLoading = false;
				this.isError = false;
			});
		} catch (e) {
			transaction(() => {
				this.isLoading = false;
				this.isError = true;
			});
			throw e;
		}
	}

	async loadNextPage() {
		invariant(this.stream, 'Mail list not ready yet');
		invariant(!this.isDestroyed, 'Mail list destroyed already');

		this.isLoading = true;

		console.log('loadNextPage');

		try {
			const start = Date.now();
			await this.stream.loadNextPage('MailList');
			console.log('loadNextPage done', Date.now() - start);
			await this.reloadMessages();
		} catch (e) {
			transaction(() => {
				this.isLoading = false;
				this.isError = true;
			});
			throw e;
		}
	}

	destroy() {
		this.isDestroyed = true;

		this.streamDisposer?.();
	}
}

//

class MailStore {
	readingSession = new SourceReadingSession();

	lastActiveFolderId: FolderId = FolderId.Inbox;
	lastMessagesList: ILinkedMessage[] = [];

	decodedMessagesById: Record<string, IMessageDecodedContent> = {};
	readMessageIds = new Set<string>();

	deletedMessageIds = new Set<string>();

	constructor() {
		makeAutoObservable(this);
	}

	async init() {
		const dbDecodedMessages = await messagesDB.retrieveAllDecodedMessages();
		this.decodedMessagesById = dbDecodedMessages.reduce(
			(p, c) => ({
				...p,
				[c.msgId]: MessagesDB.deserializeMessageDecodedContent(c),
			}),
			{},
		);

		//

		const dbReadMessage = await messagesDB.getReadMessages();
		this.readMessageIds = new Set(dbReadMessage);

		//

		const dbDeletedMessages = await messagesDB.retrieveAllDeletedMessages();
		this.deletedMessageIds = new Set(dbDeletedMessages);
	}

	async decodeMessage(msgId: string, msg: IMessage, recipient?: IGenericAccount) {
		analytics.mailOpened(this.lastActiveFolderId || 'null');

		const decodedMessage = await decodeMessage(msgId, msg, recipient);

		this.decodedMessagesById[msgId] = decodedMessage;

		if (browserStorage.saveDecodedMessages) {
			await messagesDB.saveDecodedMessage(MessagesDB.serializeMessageDecodedContent(decodedMessage));
		}
	}

	async markMessagesAsReaded(ids: string[]) {
		ids.forEach(id => this.readMessageIds.add(id));
		await messagesDB.saveMessagesRead(ids);
	}

	async markMessagesAsDeleted(messages: ILinkedMessage[]) {
		this.deletedMessageIds = new Set([...this.deletedMessageIds.values(), ...messages.map(m => m.id)]);

		await messagesDB.saveMessagesDeleted(
			messages.map(m => ({
				id: m.id,
				accountAddress: m.recipient?.account.address || 'null',
			})),
		);
	}

	async markMessagesAsNotDeleted(messages: ILinkedMessage[]) {
		this.deletedMessageIds = new Set(
			[...this.deletedMessageIds.values()].filter(id => !messages.map(m => m.id).includes(id)),
		);

		await messagesDB.saveMessagesNotDeleted(
			messages.map(m => ({
				id: m.id,
				accountAddress: m.recipient?.account.address || 'null',
			})),
		);
	}
}

export const mailStore = new MailStore();

// @ts-ignore
window.mailStore = mailStore;
