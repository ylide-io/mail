import {
	AbstractBlockchainController,
	BlockchainSourceType,
	IMessage,
	IMessageContent,
	IMessageWithSource,
	ISourceWithMeta,
	ListSourceDrainer,
	ListSourceMultiplexer,
	SourceReadingSession,
	Uint256,
} from '@ylide/sdk';
import { reaction } from 'mobx';
import { useCallback, useEffect, useState } from 'react';
import create from 'zustand';

import messagesDB, { IMessageDecodedContent } from '../indexedDB/MessagesDB';
import { analytics } from './Analytics';
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

	const readingSession = useMailStore(state => state.readingSession);

	const [activeAccounts, setActiveAccounts] = useState(domain.accounts.activeAccounts);
	reaction(
		() => domain.accounts.activeAccounts,
		() => setActiveAccounts(domain.accounts.activeAccounts),
	);

	const [blockchains, setBlockchains] = useState(domain.blockchains);
	reaction(
		() => domain.blockchains,
		() => setBlockchains(domain.blockchains),
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

		console.log(`build stream`);
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
							namespace: 'mailing',
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
			new ListSourceMultiplexer(buildSources(activeAccounts, readingSession, folderId, sender)),
		);

		async function onNewMessages({ messages }: { messages: IMessageWithSource[] }) {
			setMessages(messages.map(wrapMessage));
		}

		listSourceDrainer.on('messages', onNewMessages);

		listSourceDrainer
			.resume()
			.then(() => {
				console.log(`build stream: then`);
				if (!isDestroyed) {
					console.log(`build stream: setStream`);
					setStream(listSourceDrainer);
					loadNextPage();
				}
			})
			.catch(err => {
				console.log(`build stream: catch: `, err);
			});

		return () => {
			console.log(`build stream: destroy`);

			isDestroyed = true;
			setStream(undefined);

			listSourceDrainer.pause();
			listSourceDrainer.off('messages', onNewMessages);
		};
	}, [activeAccounts, blockchains, folderId, loadNextPage, readingSession, sender, wrapMessage]);

	useEffect(() => {
		let isDestroyed = false;

		if (stream && !stream.paused) {
			console.log(`resetFilter`);
			stream.resetFilter(m => {
				if (!filter) return true;

				const linkedMessage = wrapMessage(m);
				return filter(linkedMessage);
			});

			console.log(`resetFilter: readMore`);
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
		console.log(`loading: check`, isNextPageAvailable, isNeedMore, !!stream, !isLoading);
		if (isNextPageAvailable && isNeedMore && stream && !stream.paused && !isLoading) {
			console.log(`loading: start`);

			setLoading(true);

			// debugger;

			stream.readMore(MailPageSize).then(messages => {
				console.log(`loading: end`);
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

interface MailStore {
	init: () => Promise<void>;

	readingSession: SourceReadingSession;

	lastActiveFolderId: FolderId;
	setLastActiveFolderId: (folderId: FolderId) => void;

	lastMessagesList: ILinkedMessage[];
	setLastMessagesList: (messages: ILinkedMessage[]) => void;

	saveDecodedMessages: boolean;
	setSaveDecodedSetting: (flag: boolean) => Promise<void>;
	messagesContentById: Record<string, IMessageContent>;
	decodedMessagesById: Record<string, IMessageDecodedContent>;
	decodeMessage: (pushMsg: ILinkedMessage) => Promise<IMessageDecodedContent>;

	readMessageIds: Set<string>;
	markMessagesAsReaded: (ids: string[]) => Promise<void>;

	deletedMessageIds: Record<string, Set<string>>;
	markMessagesAsDeleted: (messages: ILinkedMessage[]) => Promise<void>;
	markMessagesAsNotDeleted: (messages: ILinkedMessage[]) => Promise<void>;
}

export const useMailStore = create<MailStore>((set, get) => ({
	init: async () => {
		const dbDecodedMessages = await messagesDB.retrieveAllDecodedMessages();
		const decodedMessagesById = dbDecodedMessages.reduce(
			(p, c) => ({
				...p,
				[c.msgId]: c,
			}),
			{},
		);

		const dbReadMessage = await messagesDB.getReadMessages();
		const readMessageIds = new Set(dbReadMessage);

		const dbDeletedMessages = await messagesDB.retrieveAllDeletedMessages();
		const deletedMessageIds: Record<string, Set<string>> = {};
		for (const acc in dbDeletedMessages) {
			deletedMessageIds[acc] = new Set(dbDeletedMessages[acc]);
		}

		set({ decodedMessagesById, readMessageIds, deletedMessageIds });
	},

	readingSession: (() => {
		const readingSession = new SourceReadingSession();

		// readingSession.sourceOptimizer = (subject, reader) => {
		// 	if (reader instanceof EthereumBlockchainController) {
		// 		return new IndexerListSource(
		// 			new EthereumListSource(reader, subject, 30000),
		// 			readingSession.indexerHub,
		// 			reader,
		// 			subject,
		// 		);
		// 	} else {
		// 		return new BlockchainListSource(reader, subject, 10000);
		// 	}
		// };

		return readingSession;
	})(),

	lastActiveFolderId: FolderId.Inbox,
	setLastActiveFolderId: folderId => set({ lastActiveFolderId: folderId }),

	lastMessagesList: [],
	setLastMessagesList: (messages: ILinkedMessage[]) => {
		set({ lastMessagesList: messages });
	},

	saveDecodedMessages: localStorage.getItem('saveDecodedMessages') !== 'false',
	setSaveDecodedSetting: async flag => {
		set({ saveDecodedMessages: flag });
		localStorage.setItem('saveDecodedMessages', flag ? 'true' : 'false');
		if (!flag) {
			await messagesDB.clearAllDecodedMessages();
		}
	},
	messagesContentById: {},
	decodedMessagesById: {},
	decodeMessage: async pushMsg => {
		const state = get();

		analytics.mailOpened(state.lastActiveFolderId || 'null');

		if (state.decodedMessagesById[pushMsg.msgId]) {
			return state.decodedMessagesById[pushMsg.msgId];
		}

		async function fetchMessageContent(pushMsg: ILinkedMessage) {
			if (state.messagesContentById[pushMsg.msgId]) {
				return state.messagesContentById[pushMsg.msgId];
			}

			// { $$meta: IEVMEnrichedEvent<GenericMessageContentEventObject> }

			const content = await domain.ylide.core.getMessageContent(pushMsg.msg);
			if (!content || content.corrupted) {
				throw new Error('Content is not available or corrupted');
			}

			state.messagesContentById[pushMsg.msgId] = content;

			return content;
		}

		const content = await fetchMessageContent(pushMsg);

		const result = pushMsg.msg.isBroadcast
			? await domain.ylide.core.decryptBroadcastContent(pushMsg.msg, content)
			: await domain.ylide.core.decryptMessageContent(pushMsg.recipient!.account, pushMsg.msg, content);

		const decodedMessage = {
			msgId: pushMsg.msgId,
			decodedSubject: result.subject,
			decodedTextData: result.content,
		};

		state.decodedMessagesById[pushMsg.msgId] = decodedMessage;
		set({ decodedMessagesById: { ...state.decodedMessagesById } });

		if (state.saveDecodedMessages) {
			console.log('msg saved: ', pushMsg.msgId);
			await messagesDB.saveDecodedMessage(decodedMessage);
		}

		return decodedMessage;
	},

	readMessageIds: new Set(),
	markMessagesAsReaded: async ids => {
		const readMessageIds = new Set(get().readMessageIds);
		ids.forEach(id => readMessageIds.add(id));
		set({ readMessageIds });

		await messagesDB.saveMessagesRead(ids);
	},

	deletedMessageIds: {},
	markMessagesAsDeleted: async messages => {
		const deletedMessageIds = { ...get().deletedMessageIds };

		messages.forEach(m => {
			if (deletedMessageIds[m.recipient?.account.address || 'null']) {
				deletedMessageIds[m.recipient?.account.address || 'null'].add(m.id);
			} else {
				deletedMessageIds[m.recipient?.account.address || 'null'] = new Set([m.id]);
			}
		});

		set({ deletedMessageIds });

		await messagesDB.saveMessagesDeleted(
			messages.map(m => ({
				id: m.id,
				accountAddress: m.recipient?.account.address || 'null',
			})),
		);
	},
	markMessagesAsNotDeleted: async messages => {
		const deletedMessageIds = { ...get().deletedMessageIds };

		messages.forEach(m => {
			if (deletedMessageIds[m.recipient?.account.address || 'null']) {
				deletedMessageIds[m.recipient?.account.address || 'null'].delete(m.id);
			}
		});

		set({ deletedMessageIds });

		await messagesDB.saveMessagesNotDeleted(
			messages.map(m => ({
				id: m.id,
				accountAddress: m.recipient?.account.address || 'null',
			})),
		);
	},
}));
