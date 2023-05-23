import { EthereumBlockchainController } from '@ylide/ethereum';
import {
	AbstractBlockchainController,
	BlockchainSourceType,
	IMessage,
	IMessageWithSource,
	ISourceWithMeta,
	ListSourceDrainer,
	ListSourceMultiplexer,
	SourceReadingSession,
	Uint256,
	YLIDE_MAIN_FEED_ID,
} from '@ylide/sdk';
import { autobind } from 'core-decorators';
import { makeAutoObservable, makeObservable, observable, transaction } from 'mobx';

import messagesDB, { MessagesDB } from '../indexedDB/impl/MessagesDB';
import { IMessageDecodedContent } from '../indexedDB/IndexedDB';
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

function wrapMessageId(p: IMessageWithSource) {
	const acc = p.meta.account as DomainAccount;
	return `${p.msg.msgId}:${acc.account.address}`;
}

async function wrapMessage(p: IMessageWithSource): Promise<ILinkedMessage> {
	const acc = p.meta.account as DomainAccount;
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

export class MailList {
	@observable isLoading = true;
	@observable isNextPageAvailable = true;
	@observable messages: ILinkedMessage[] = [];

	private readonly stream: ListSourceDrainer;

	constructor(props: { folderId: FolderId; sender?: string; filter?: (id: string) => boolean }) {
		function buildSources(): ISourceWithMeta[] {
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

			if (props.folderId === FolderId.Inbox || props.folderId === FolderId.Archive) {
				return activeAccounts
					.map(acc => getDirectWithMeta(acc.uint256Address, props.sender || null, acc))
					.flat();
			} else if (props.folderId === FolderId.Sent) {
				return activeAccounts.map(acc => getDirectWithMeta(acc.sentAddress, null, acc)).flat();
			} else {
				const tag = tags.tags.find(t => String(t.id) === props.folderId);
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

		const stream = (this.stream = new ListSourceDrainer(new ListSourceMultiplexer(buildSources())));

		stream.resetFilter(m => {
			return props.filter ? props.filter(wrapMessageId(m)) : true;
		});

		stream.on('messages', this.onNewMessages);

		stream.resume().then(() => {
			this.loadNextPage();
		});

		makeObservable(this);
	}

	@autobind
	private async onNewMessages({ messages }: { messages: IMessageWithSource[] }) {
		this.messages = await wrapMessages(messages);
	}

	loadNextPage() {
		this.isLoading = true;

		this.stream.readMore(MailPageSize).then(messages => {
			wrapMessages(messages).then(wrapped => {
				transaction(() => {
					this.messages = wrapped;
					this.isNextPageAvailable = !this.stream.drained;
					this.isLoading = false;
				});
			});
		});
	}

	destroy() {
		this.stream.pause();
		this.stream.off('messages', this.onNewMessages);
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
