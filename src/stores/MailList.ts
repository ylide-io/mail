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
import { makeAutoObservable, reaction } from 'mobx';
import { useCallback, useEffect, useState } from 'react';

import messagesDB, { IMessageDecodedSerializedContent } from '../indexedDB/MessagesDB';
import { invariant } from '../utils/assert';
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

export interface ILinkedMessage {
	id: string;
	msgId: string;
	msg: IMessage;
	recipient: DomainAccount | null;
	reader: AbstractBlockchainController;
}

interface UseMailListProps {
	folderId: FolderId;
	sender?: string;
	filter?: (m: ILinkedMessage) => boolean;
}

export function useMailList(props?: UseMailListProps) {
	const folderId = props?.folderId;
	const sender = props?.sender;
	const filter = props?.filter;

	const [activeAccounts, setActiveAccounts] = useState(domain.accounts.activeAccounts);
	useEffect(
		() =>
			reaction(
				() => domain.accounts.activeAccounts,
				() => setActiveAccounts(domain.accounts.activeAccounts),
			),
		[],
	);

	const [blockchains, setBlockchains] = useState(domain.blockchains);
	useEffect(
		() =>
			reaction(
				() => domain.blockchains,
				() => setBlockchains(domain.blockchains),
			),
		[],
	);

	const [stream, setStream] = useState<ListSourceDrainer | undefined>();
	const [messages, setMessages] = useState<ILinkedMessage[]>([]);
	const [isLoading, setLoading] = useState(false);
	const [isNextPageAvailable, setNextPageAvailable] = useState(true);
	const [isNeedMore, setNeedMore] = useState(false);
	const loadNextPage = useCallback(() => setNeedMore(true), []);

	const wrapMessage = useCallback((p: IMessageWithSource): ILinkedMessage => {
		const acc = p.meta.account as DomainAccount;
		return {
			id: `${p.msg.msgId}:${acc.account.address}`,
			msgId: p.msg.msgId,
			msg: p.msg,
			recipient: acc || null,
			reader: domain.ylide.controllers.blockchainsMap[p.msg.blockchain],
		};
	}, []);

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
			setMessages(messages.map(wrapMessage));
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
	}, [activeAccounts, blockchains, folderId, loadNextPage, sender, wrapMessage]);

	useEffect(() => {
		let isDestroyed = false;

		if (stream && !stream.paused) {
			stream.resetFilter(m => {
				if (!filter) return true;

				const linkedMessage = wrapMessage(m);
				return filter(linkedMessage);
			});

			stream.readMore(MailPageSize).then(m => {
				if (!isDestroyed) {
					setMessages(m.map(wrapMessage));
					setNextPageAvailable(!stream.drained);
				}
			});
		}

		return () => {
			isDestroyed = true;
		};
	}, [filter, stream, wrapMessage]);

	useEffect(() => {
		if (isNextPageAvailable && isNeedMore && stream && !stream.paused && !isLoading) {
			setLoading(true);

			stream.readMore(MailPageSize).then(messages => {
				setMessages(messages.map(wrapMessage));
				setNextPageAvailable(!stream.drained);
				setLoading(false);
			});
		}
	}, [isLoading, isNeedMore, isNextPageAvailable, stream, wrapMessage]);

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

	deletedMessageIds: Record<string, Set<string>> = {};

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
		const deletedMessageIds: Record<string, Set<string>> = {};
		for (const acc in dbDeletedMessages) {
			deletedMessageIds[acc] = new Set(dbDeletedMessages[acc]);
		}

		this.deletedMessageIds = deletedMessageIds;
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
		const deletedMessageIds = { ...this.deletedMessageIds };

		messages.forEach(m => {
			if (deletedMessageIds[m.recipient?.account.address || 'null']) {
				deletedMessageIds[m.recipient?.account.address || 'null'].add(m.id);
			} else {
				deletedMessageIds[m.recipient?.account.address || 'null'] = new Set([m.id]);
			}
		});

		this.deletedMessageIds = deletedMessageIds;

		await messagesDB.saveMessagesDeleted(
			messages.map(m => ({
				id: m.id,
				accountAddress: m.recipient?.account.address || 'null',
			})),
		);
	}

	async markMessagesAsNotDeleted(messages: ILinkedMessage[]) {
		const deletedMessageIds = { ...this.deletedMessageIds };

		messages.forEach(m => {
			if (deletedMessageIds[m.recipient?.account.address || 'null']) {
				deletedMessageIds[m.recipient?.account.address || 'null'].delete(m.id);
			}
		});

		this.deletedMessageIds = deletedMessageIds;

		await messagesDB.saveMessagesNotDeleted(
			messages.map(m => ({
				id: m.id,
				accountAddress: m.recipient?.account.address || 'null',
			})),
		);
	}
}

export const mailStore = new MailStore();
