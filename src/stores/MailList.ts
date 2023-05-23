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
import { makeAutoObservable, makeObservable, observable, transaction } from 'mobx';

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

	private stream: ListSourceDrainer | undefined;

	constructor() {
		makeObservable(this);
	}

	async init(props: {
		mailbox?: { folderId: FolderId; sender?: string; filter?: (id: string) => boolean };
		venomFeed?: { account: DomainAccount };
	}) {
		const { mailbox, venomFeed } = props;

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
				const venomFeedId = '0000000000000000000000000000000000000000000000000000000000000004' as Uint256;
				const composedFeedId = await blockchainController.getComposedFeedId(venomFeedId, 1);
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
						meta: { account: venomFeed.account },
					},
				];
			}

			this.stream = new ListSourceDrainer(new ListSourceMultiplexer(await buildVenomFources()));
		} else {
			throw new Error('Cannot init list sources');
		}

		this.stream.on('messages', this.onNewMessages);

		this.stream.resume().then(() => {
			this.loadNextPage();
		});
	}

	@autobind
	private async onNewMessages({ messages }: { messages: IMessageWithSource[] }) {
		this.messages = await wrapMessages(messages);
	}

	loadNextPage() {
		this.isLoading = true;

		this.stream?.readMore(MailPageSize).then(messages => {
			wrapMessages(messages).then(wrapped => {
				transaction(() => {
					this.messages = wrapped;
					this.isNextPageAvailable = !this.stream?.drained;
					this.isLoading = false;
				});
			});
		});
	}

	destroy() {
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
