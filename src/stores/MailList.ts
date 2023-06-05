import { EthereumBlockchainController } from '@ylide/ethereum';
import { EverscaleBlockchainController } from '@ylide/everscale';
import {
	AbstractBlockchainController,
	BlockchainSourceType,
	IBlockchainSourceSubject,
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

const MailPageSize = 10;

const FILTERED_OUT = {};

function wrapMessageId(p: IMessageWithSource) {
	const acc = p.meta?.account as DomainAccount | undefined;
	return `${p.msg.msgId}${acc ? `:${acc.account.address}` : ''}`;
}

async function wrapMessage(p: IMessageWithSource): Promise<ILinkedMessage> {
	const acc = p.meta?.account as DomainAccount | undefined;
	const reader = domain.ylide.controllers.blockchainsMap[p.msg.blockchain];

	let recipients: string[] = [];
	try {
		recipients = (await (reader as EthereumBlockchainController).getMessageRecipients(p.msg, true))!.recipients.map(
			formatAddress,
		);
	} catch (e) {}

	return {
		id: wrapMessageId(p),
		msgId: p.msg.msgId,
		msg: p.msg,
		recipient: acc || null,
		recipients,
		reader,
	};
}

async function wrapMessages(p: IMessageWithSource[]): Promise<ILinkedMessage[]> {
	return await Promise.all(p.map(wrapMessage));
}

export interface ILinkedMessage {
	id: string;
	msgId: string;
	msg: IMessage;
	recipient: DomainAccount | null;
	recipients: string[];
	reader: AbstractBlockchainController;
}

export class MailList<M = ILinkedMessage> {
	private isDestroyed = false;

	@observable isNextPageAvailable = true;
	@observable isLoading = true;
	@observable isError = false;

	@observable.shallow private messagesData: { raw: IMessageWithSource; handled: M | typeof FILTERED_OUT }[] = [];

	private stream: ListSourceDrainer | undefined;

	private messagesFilter: ((messages: ILinkedMessage[]) => ILinkedMessage[] | Promise<ILinkedMessage[]>) | undefined;
	private messageHandler: ((message: ILinkedMessage) => M | Promise<M>) | undefined;

	constructor() {
		makeObservable(this);
	}

	async init(props: {
		messagesFilter?: (messages: ILinkedMessage[]) => ILinkedMessage[] | Promise<ILinkedMessage[]>;
		messageHandler?: (message: ILinkedMessage) => M | Promise<M>;
		mailbox?: { folderId: FolderId; sender?: string; filter?: (id: string) => boolean };
		venomFeed?: boolean;
	}) {
		const { messagesFilter, messageHandler, mailbox, venomFeed } = props;

		this.messagesFilter = messagesFilter;
		this.messageHandler = messageHandler;

		if (mailbox) {
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
				}

				const activeAccounts = domain.accounts.activeAccounts;

				if (mailbox.folderId === FolderId.Inbox || mailbox.folderId === FolderId.Archive) {
					return activeAccounts
						.map(acc => getDirectWithMeta(acc.uint256Address, mailbox.sender || null, acc))
						.flat();
				} else if (mailbox.folderId === FolderId.Sent) {
					return activeAccounts.map(acc => getDirectWithMeta(acc.sentAddress, null, acc)).flat();
				} else {
					const tag = tags.tags.find(t => String(t.id) === mailbox.folderId);
					if (!tag) {
						return [];
					}
					const contactsV = contacts.contacts.filter(c => c.tags.includes(tag.id));
					return contactsV
						.map(v => activeAccounts.map(acc => getDirectWithMeta(acc.uint256Address, v.address, acc)))
						.flat()
						.flat();
				}
			}

			this.stream = new ListSourceDrainer(new ListSourceMultiplexer(buildMailboxSources()));

			this.stream.resetFilter(m => {
				return mailbox.filter ? mailbox.filter(wrapMessageId(m)) : true;
			});
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
		} else {
			throw new Error('Cannot init list sources');
		}

		if (this.isDestroyed) return;

		this.stream.on('messages', this.onNewMessages);

		await this.stream.resume().then(() => {
			this.loadNextPage();
		});
	}

	@computed
	get messages() {
		return this.messagesData.filter(m => m.handled !== FILTERED_OUT).map(m => m.handled as M);
	}

	private async handleMessages(messages: IMessageWithSource[]) {
		const newMessages = messages.filter(m => !this.messagesData.find(old => old.raw.msg.msgId === m.msg.msgId));
		const newLinked = await wrapMessages(newMessages);
		const newFiltered = this.messagesFilter ? await this.messagesFilter(newLinked) : newLinked;

		return await Promise.all(
			messages.map(async raw => {
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
	private async onNewMessages({ messages }: { messages: IMessageWithSource[] }) {
		this.messagesData = await this.handleMessages(messages);
	}

	loadNextPage() {
		invariant(this.stream, 'Mail list not ready yet');
		invariant(!this.isDestroyed, 'Mail list destroyed already');

		this.isLoading = true;

		return this.stream
			.readMore(MailPageSize)
			.then(messages =>
				this.handleMessages(messages).then(data => {
					transaction(() => {
						this.messagesData = data;
						this.isNextPageAvailable = !this.stream?.drained;
						this.isLoading = false;
						this.isError = false;
					});
				}),
			)
			.catch(e => {
				transaction(() => {
					this.isLoading = false;
					this.isError = true;
				});
				throw e;
			});
	}

	destroy() {
		this.isDestroyed = true;

		this.stream?.pause();
		this.stream?.off('messages', this.onNewMessages);
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

	async decodeMessage(pushMsg: ILinkedMessage) {
		analytics.mailOpened(this.lastActiveFolderId || 'null');

		const decodedMessage = await decodeMessage(pushMsg.msgId, pushMsg.msg, pushMsg.recipient!.account);

		this.decodedMessagesById[pushMsg.msgId] = decodedMessage;

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
