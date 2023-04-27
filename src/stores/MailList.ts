import { EthereumBlockchainController } from '@ylide/ethereum';
import {
	AbstractBlockchainController,
	BlockchainSourceType,
	IGenericAccount,
	IMessage,
	IMessageWithSource,
	ISourceWithMeta,
	ListSourceDrainer,
	ListSourceMultiplexer,
	SourceReadingSession,
	Uint256,
	YLIDE_MAIN_FEED_ID,
	YMF,
} from '@ylide/sdk';
import { makeAutoObservable } from 'mobx';
import { useCallback, useEffect, useState } from 'react';

import messagesDB, { IMessageDecodedSerializedContent } from '../indexedDB/MessagesDB';
import { invariant } from '../utils/assert';
import { formatAddress } from '../utils/blockchain';
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

export async function decodeMessage(msgId: string, msg: IMessage, recepient: IGenericAccount) {
	const content = await domain.ylide.core.getMessageContent(msg);
	invariant(content && !content.corrupted, 'Content is not available or corrupted');

	const result = msg.isBroadcast
		? domain.ylide.core.decryptBroadcastContent(msg, content)
		: await domain.ylide.core.decryptMessageContent(recepient, msg, content);

	return {
		msgId,
		decodedSubject: result.content.subject,
		decodedTextData: result.content.content,
	};
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

interface UseMailListProps {
	folderId: FolderId;
	sender?: string;
	filter?: (id: string) => boolean;
}

export function useMailList(props?: UseMailListProps) {
	const folderId = props?.folderId;
	const sender = props?.sender;
	const filter = props?.filter;

	const [stream, setStream] = useState<ListSourceDrainer | undefined>();
	const [messages, setMessages] = useState<ILinkedMessage[]>([]);
	const [isLoading, setLoading] = useState(false);
	const [isNextPageAvailable, setNextPageAvailable] = useState(true);
	const [isNeedMore, setNeedMore] = useState(false);
	const loadNextPage = useCallback(() => setNeedMore(true), []);

	const activeAccounts = domain.accounts.activeAccounts;
	const blockchains = domain.blockchains;

	useEffect(() => {
		if (!folderId) return;

		let isDestroyed = false;

		setStream(undefined);
		setMessages([]);
		setNextPageAvailable(true);

		function buildSources(
			activeAccounts: DomainAccount[],
			readingSession: SourceReadingSession,
			folderId: FolderId,
			sender?: string,
		): ISourceWithMeta[] {
			function getDirectWithMeta(
				recipient: Uint256,
				sender: string | null,
				account: DomainAccount,
			): ISourceWithMeta[] {
				return domain.ylide.core
					.getListSources(readingSession, [
						{
							feedId: YLIDE_MAIN_FEED_ID,
							type: BlockchainSourceType.DIRECT,
							recipient,
							sender,
						},
					])
					.map(source => ({ source, meta: { account } }));
			}

			if (folderId === FolderId.Inbox || folderId === FolderId.Archive) {
				return activeAccounts.map(acc => getDirectWithMeta(acc.uint256Address, sender || null, acc)).flat();
			} else if (folderId === FolderId.Sent) {
				return activeAccounts.map(acc => getDirectWithMeta(acc.sentAddress, null, acc)).flat();
			} else {
				const tag = tags.tags.find(t => String(t.id) === folderId);
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

		const listSourceDrainer = new ListSourceDrainer(
			new ListSourceMultiplexer(buildSources(activeAccounts, mailStore.readingSession, folderId, sender)),
		);

		async function onNewMessages({ messages }: { messages: IMessageWithSource[] }) {
			setMessages(await wrapMessages(messages));
		}

		listSourceDrainer.on('messages', onNewMessages);

		listSourceDrainer.resume().then(() => {
			if (!isDestroyed) {
				setStream(listSourceDrainer);
				loadNextPage();
			}
		});

		return () => {
			isDestroyed = true;
			setStream(undefined);

			listSourceDrainer.pause();
			listSourceDrainer.off('messages', onNewMessages);
		};
	}, [activeAccounts, blockchains, folderId, loadNextPage, sender]);

	useEffect(() => {
		let isDestroyed = false;

		if (stream && !stream.paused) {
			setLoading(true);

			stream.resetFilter(m => {
				if (!filter) return true;
				return filter(wrapMessageId(m));
			});

			stream.readMore(MailPageSize).then(messages => {
				wrapMessages(messages).then(wrapped => {
					if (!isDestroyed) {
						setMessages(wrapped);
						setNextPageAvailable(!stream.drained);
						setLoading(false);
					}
				});
			});
		}

		return () => {
			isDestroyed = true;
		};
	}, [filter, stream]);

	useEffect(() => {
		if (isNextPageAvailable && isNeedMore && stream && !stream.paused && !isLoading) {
			setLoading(true);

			stream.readMore(MailPageSize).then(messages => {
				wrapMessages(messages).then(wrapped => {
					setMessages(wrapped);
					setNextPageAvailable(!stream.drained);
					setLoading(false);
				});
			});
		}
	}, [isLoading, isNeedMore, isNextPageAvailable, stream]);

	return {
		isLoading: !stream || isLoading,
		messages,
		isNextPageAvailable,
		loadNextPage,
	};
}

//

class MailStore {
	readingSession = new SourceReadingSession();

	lastActiveFolderId: FolderId = FolderId.Inbox;
	lastMessagesList: ILinkedMessage[] = [];

	decodedMessagesById: Record<string, IMessageDecodedSerializedContent> = {};
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
				[c.msgId]: c,
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

		const serializedMsg = {
			...decodedMessage,
			decodedTextData:
				decodedMessage.decodedTextData instanceof YMF
					? {
							type: 'YMF' as const,
							value: decodedMessage.decodedTextData.toString(),
					  }
					: {
							type: 'plain' as const,
							value: decodedMessage.decodedTextData,
					  },
		};

		this.decodedMessagesById[pushMsg.msgId] = serializedMsg;

		if (browserStorage.saveDecodedMessages) {
			await messagesDB.saveDecodedMessage(serializedMsg);
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
