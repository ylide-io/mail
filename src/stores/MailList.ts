import { EVMBlockchainController } from '@ylide/ethereum';
import { TVMBlockchainController } from '@ylide/everscale';
import {
	AbstractBlockchainController,
	BlockchainSourceType,
	IBlockchainSourceSubject,
	IListSource,
	IMessage,
	IMessageWithSource,
	ISourceWithMeta,
	ListSource,
	ListSourceDrainer,
	ListSourceMultiplexer,
	SourceReadingSession,
	Uint256,
	WalletAccount,
	YLIDE_MAIN_FEED_ID,
} from '@ylide/sdk';
import { autobind } from 'core-decorators';
import { computed, makeAutoObservable, makeObservable, observable, reaction, transaction } from 'mobx';
import { nanoid } from 'nanoid';

import { VENOM_FEED_ID } from '../constants';
import messagesDB, { MessagesDB } from '../indexedDB/impl/MessagesDB';
import { IMessageDecodedContent } from '../indexedDB/IndexedDB';
import { invariant } from '../utils/assert';
import { formatAddress } from '../utils/blockchain';
import { getGlobalFeedSubject, isGlobalMessage, SEND_TO_ALL_ADDRESS } from '../utils/globalFeed';
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

const FILTERED_OUT = {};

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
		if (isGlobalMessage(message)) {
			return `${message.msgId}:${SEND_TO_ALL_ADDRESS}`;
		}

		return `${message.msgId}:${account.account.address}`;
	}

	export async function fromIMessage(
		folderId: FolderId | undefined,
		message: IMessage,
		account: DomainAccount,
	): Promise<ILinkedMessage> {
		const reader = domain.ylide.controllers.blockchainsMap[message.blockchain];

		let recipients: string[] = [];
		try {
			// console.log('folderId: ', folderId);
			if (folderId === FolderId.Sent) {
				recipients = (await (reader as EVMBlockchainController).getMessageRecipients(
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
		folderId: FolderId | undefined,
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
		folderId: FolderId | undefined,
		p: IMessageWithSource,
	): Promise<ILinkedMessage> {
		return fromIMessage(folderId, p.msg, p.meta.account);
	}

	export async function fromIMessageWithSourceArray(
		folderId: FolderId | undefined,
		p: IMessageWithSource[],
	): Promise<ILinkedMessage[]> {
		return await Promise.all(p.map(m => fromIMessageWithSource(folderId, m)));
	}

	//

	export function parseId(id: string) {
		// id could look like 'IRLwHRdNAAUB9Q==:0:6bf6da64c5f3da47d125d8b1d39bb9097ab5b047'
		// (address contains ':' too)

		const [msgId, ...rest] = id.split(':');
		const address = rest.join(':');
		invariant(msgId && address, `Invalid LinkedMessage ID: ${id}`);
		return {
			msgId,
			address,
		};
	}
}

export class MailList<M = ILinkedMessage> {
	id = nanoid();
	folderId: FolderId | undefined;

	@observable isNextPageAvailable = true;
	@observable isLoading = true;
	@observable isError = false;

	@observable.shallow messagesData: { raw: IMessageWithSource; handled: M | typeof FILTERED_OUT }[] = [];
	@observable newMessagesCount = 0;

	private stream: ListSourceDrainer | undefined;
	private streamDisposer: (() => void) | undefined;

	private messagesFilter: ((messages: ILinkedMessage[]) => ILinkedMessage[] | Promise<ILinkedMessage[]>) | undefined;
	private messageHandler: ((message: ILinkedMessage) => M | Promise<M>) | undefined;

	constructor() {
		makeObservable(this);
	}

	get isActive() {
		return !!this.stream;
	}

	async init(props: {
		messagesFilter?: (messages: ILinkedMessage[]) => ILinkedMessage[] | Promise<ILinkedMessage[]>;
		messageHandler?: (message: ILinkedMessage) => M | Promise<M>;
		mailbox?: { accounts: DomainAccount[]; folderId: FolderId; sender?: string; filter?: (id: string) => boolean };
		venomFeed?: boolean;
	}) {
		const { messagesFilter, messageHandler, mailbox, venomFeed } = props;

		this.messagesFilter = messagesFilter;
		this.messageHandler = messageHandler;

		if (this.stream) {
			throw new Error('Mail list was not destroyed before reinit');
		}

		this.folderId = undefined;

		if (mailbox) {
			this.folderId = mailbox.folderId;

			function buildMailboxSources(): ISourceWithMeta[] {
				invariant(mailbox);

				const enrichWithGlobalSubject = (data: ISourceWithMeta[], account?: DomainAccount, sent = false) => {
					if (!account) return data;

					const globalSubject = getGlobalFeedSubject(sent ? account.account.address : null);

					const blockchainController = domain.blockchains[
						globalSubject.blockchain
					] as EVMBlockchainController;

					const listSource = new ListSource(
						mailStore.readingSession,
						globalSubject,
						blockchainController.ininiateMessagesSource(globalSubject),
					) as IListSource;

					return [{ source: listSource, meta: { account } } as ISourceWithMeta].concat(data);
				};

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
				}

				if (mailbox.folderId === FolderId.Inbox || mailbox.folderId === FolderId.Archive) {
					const mailboxData = mailbox.accounts
						.map(acc => getDirectWithMeta(acc.uint256Address, mailbox.sender || null, acc))
						.flat();
					return enrichWithGlobalSubject(mailboxData, mailbox.accounts[0]);
				} else if (mailbox.folderId === FolderId.Sent) {
					const mailboxData = mailbox.accounts
						.map(acc => getDirectWithMeta(acc.sentAddress, null, acc))
						.flat();
					const globalFeedWriter = mailbox.accounts.find(acc => acc.isGlobalFeedWriter);
					return enrichWithGlobalSubject(mailboxData, globalFeedWriter, true);
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

			const newStream = new ListSourceDrainer(new ListSourceMultiplexer(buildMailboxSources()));
			const start = Date.now();
			const { dispose } = await newStream.connect(this.onNewMessages.bind(this, newStream));
			console.debug('MailList init', this.id, Date.now() - start);
			this.streamDisposer = dispose;
			await newStream.resetFilter(m => {
				return mailbox.filter ? mailbox.filter(ILinkedMessage.idFromIMessageWithSource(m)) : true;
			});
			this.stream = newStream;
			await this.reloadMessages();
		} else if (venomFeed) {
			async function buildVenomFources(): Promise<ISourceWithMeta[]> {
				invariant(venomFeed);

				const blockchainController = domain.blockchains['venom-testnet'] as TVMBlockchainController;
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

			const newStream = new ListSourceDrainer(new ListSourceMultiplexer(await buildVenomFources()));
			const start = Date.now();
			const { dispose } = await newStream.connect(this.onNewMessages.bind(this, newStream));
			console.debug('MailList init', this.id, Date.now() - start);
			this.streamDisposer = dispose;
			this.stream = newStream;
			await this.reloadMessages();
		} else {
			throw new Error('Cannot init list sources');
		}
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
	private async onNewMessages(stream: ListSourceDrainer) {
		this.newMessagesCount = stream.newMessagesCount || 0;
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

		this.isLoading = true;

		console.debug('loadNextPage');

		try {
			const start = Date.now();
			await this.stream.loadNextPage('MailList');
			console.debug('loadNextPage done', Date.now() - start);
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
		this.stream = undefined;
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

	init() {
		// Reset when account list changes
		reaction(
			() => domain.accounts.activeAccounts,
			() => (this.lastMessagesList = []),
		);

		messagesDB.retrieveAllDecodedMessages().then(dbDecodedMessages => {
			this.decodedMessagesById = dbDecodedMessages.reduce(
				(p, c) => ({
					...p,
					[c.msgId]: MessagesDB.deserializeMessageDecodedContent(c),
				}),
				{},
			);
		});

		messagesDB.getReadMessages().then(dbReadMessage => {
			this.readMessageIds = new Set(dbReadMessage);
		});

		messagesDB.retrieveAllDeletedMessages().then(dbDeletedMessages => {
			this.deletedMessageIds = new Set(dbDeletedMessages);
		});
	}

	async decodeMessage(msgId: string, msg: IMessage, recipient?: WalletAccount) {
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
