import { EthereumBlockchainController, EthereumBlockchainSource, EthereumListSource } from '@ylide/ethereum';
import {
	AbstractBlockchainController,
	IListSource,
	IMessageWithSource,
	ListSourceDrainer,
	ListSourceMultiplexer,
	SourceReadingSession,
	Uint256,
	Ylide,
} from '@ylide/sdk';
import {
	BlockchainSourceType,
	IMessage,
	IMessageContent,
	IMessagesListConfigurationManager,
	ISourceSubject,
	MessagesList,
} from '@ylide/sdk';
import { autobind } from 'core-decorators';
import { makeObservable, observable } from 'mobx';
import messagesDB, { IMessageDecodedContent } from '../indexedDB/MessagesDB';
import contacts from './Contacts';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';
import tags from './Tags';

export interface IFolder {
	id: string;
	title: string;
	tag: string;
	subjects: ISourceSubject[];
}

export interface ILinkedMessage {
	id: string;
	msgId: Uint256;
	msg: IMessage;
	recipient: DomainAccount | null;
	reader: AbstractBlockchainController;
}

export class MailList {
	// @ts-ignore
	readingSession: SourceReadingSession = (window.rs = new SourceReadingSession());

	@observable messages: ILinkedMessage[] = [];
	@observable isNextPageAvailable: boolean = false;
	@observable loading: boolean = true;
	@observable firstLoading: boolean = true;

	@observable saveDecodedMessages = localStorage.getItem('saveDecodedMessages') === 'true';

	@observable folderById: Record<string, IFolder> = {};
	@observable folderIds: string[] = ['inbox', 'sent', 'archive'];

	currentList!: ListSourceDrainer;

	initedById: Record<string, boolean> = {};

	@observable messagesContentById: Record<string, IMessageContent> = {};
	@observable decodedMessagesById: Record<string, IMessageDecodedContent> = {};
	@observable checkedMessageIds: string[] = [];
	@observable readMessageIds: Set<string> = new Set();

	deletedMessageIds: Record<string, Set<string>> = {};

	@observable activeFolderId: string | null = null;
	@observable globalSubscriptions: string[] = [];

	accountSourceMatch: Map<IListSource, { account: DomainAccount; reader: AbstractBlockchainController }> = new Map();

	constructor() {
		makeObservable(this);

		this.readingSession.sourceOptimizer = (subject, reader) => {
			if (reader instanceof EthereumBlockchainController) {
				return new EthereumListSource(reader, subject);
			}
			return null;
		};
	}

	async init() {
		const dmsgs = await messagesDB.retrieveAllDecodedMessages();
		this.decodedMessagesById = dmsgs.reduce(
			(p, c) => ({
				...p,
				[c.msgId]: c,
			}),
			{},
		);
		const deletedMessageIds = await messagesDB.retrieveAllDeletedMessages();
		for (const acc in deletedMessageIds) {
			this.deletedMessageIds[acc] = new Set(deletedMessageIds[acc]);
		}
		const readMessageIds = await messagesDB.getReadMessages();
		this.readMessageIds = new Set(readMessageIds);
	}

	getFolderName(folderId: string) {
		if (folderId === 'inbox') {
			return 'Inbox';
		} else if (folderId === 'sent') {
			return 'Sent';
		} else if (folderId === 'subscriptions') {
			return 'Subscription';
		} else if (folderId === 'archive') {
			return 'Archive';
		} else {
			const tag = tags.tags.find(t => String(t.id) === folderId);
			if (!tag) {
				return this.folderById[folderId].title;
			} else {
				return tag.name;
			}
		}
	}

	checkMessage(message: ILinkedMessage, flag: boolean) {
		if (flag) {
			this.checkedMessageIds.push(message.id);
		} else {
			this.checkedMessageIds = this.checkedMessageIds.filter(id => id !== message.id);
		}
	}

	isMessageChecked(id: string) {
		return this.checkedMessageIds.includes(id);
	}

	async markMessagesAsReaded(ids: string[]) {
		ids.forEach(id => this.readMessageIds.add(id));
		await messagesDB.saveMessagesRead(ids);
	}

	async markMessageAsReaded(id: string) {
		this.readMessageIds.add(id);
		await messagesDB.saveMessageRead(id);
	}

	async markAsReaded() {
		await this.markMessagesAsReaded(this.checkedMessageIds);
		this.checkedMessageIds = [];
	}

	@autobind
	deletedFilter(m: IMessageWithSource): boolean {
		const { id, recipient } = this.wrapMessage(m);
		return !this.deletedMessageIds[recipient?.account.address || 'null']?.has(id);
	}

	@autobind
	onlyDeletedFilter(m: IMessageWithSource): boolean {
		const { id, recipient } = this.wrapMessage(m);
		return this.deletedMessageIds[recipient?.account.address || 'null']?.has(id);
	}

	async deletedWasUpdated() {
		if (this.activeFolderId === 'inbox') {
			this.currentList.resetFilter(this.deletedFilter);
			this.messages = (await this.currentList.readMore(10)).map(this.wrapMessage);
		} else if (this.activeFolderId === 'archive') {
			this.currentList.resetFilter(this.onlyDeletedFilter);
			this.messages = (await this.currentList.readMore(10)).map(this.wrapMessage);
		}
	}

	async markMessageAsDeleted(m: ILinkedMessage) {
		if (this.deletedMessageIds[m.recipient?.account.address || 'null']) {
			this.deletedMessageIds[m.recipient?.account.address || 'null'].add(m.id);
		} else {
			this.deletedMessageIds[m.recipient?.account.address || 'null'] = new Set([m.id]);
		}
		await messagesDB.saveMessageDeleted(m.id, m.recipient?.account.address || 'null');
		await this.deletedWasUpdated();
	}

	async markMessagesAsDeleted(ms: ILinkedMessage[]) {
		ms.forEach(m => {
			if (this.deletedMessageIds[m.recipient?.account.address || 'null']) {
				this.deletedMessageIds[m.recipient?.account.address || 'null'].add(m.id);
			} else {
				this.deletedMessageIds[m.recipient?.account.address || 'null'] = new Set([m.id]);
			}
		});
		await messagesDB.saveMessagesDeleted(
			ms.map(m => ({
				id: m.id,
				accountAddress: m.recipient?.account.address || 'null',
			})),
		);
		await this.deletedWasUpdated();
	}

	async markAsDeleted() {
		await this.markMessagesAsDeleted(this.messages.filter(t => this.checkedMessageIds.includes(t.id)));
		this.checkedMessageIds = [];
	}

	async fetchMessageContent(pushMsg: ILinkedMessage) {
		if (this.messagesContentById[pushMsg.msgId]) {
			return this.messagesContentById[pushMsg.msgId];
		}

		const content = await pushMsg.reader.retrieveMessageContentByMsgId(pushMsg.msgId);
		if (!content || content.corrupted) {
			throw new Error('Content is not available or corrupted');
		}

		this.messagesContentById[pushMsg.msgId] = content;

		return content;
	}

	async decodeMessage(pushMsg: ILinkedMessage) {
		if (this.decodedMessagesById[pushMsg.msgId]) {
			return this.decodedMessagesById[pushMsg.msgId];
		}

		const content = await this.fetchMessageContent(pushMsg);

		const result = pushMsg.msg.isBroadcast
			? await domain.ylide.decryptBroadcastContent(pushMsg.msg, content)
			: await domain.ylide.decryptMessageContent(pushMsg.recipient!.account, pushMsg.msg, content);

		this.decodedMessagesById[pushMsg.msgId] = {
			msgId: pushMsg.msgId,
			decodedSubject: result.subject,
			decodedTextData: result.content,
		};

		if (this.saveDecodedMessages) {
			console.log('msg saved: ', pushMsg.msgId);
			await messagesDB.saveDecodedMessage(this.decodedMessagesById[pushMsg.msgId]);
		}
	}

	async setSaveDecodedSetting(flag: boolean) {
		this.saveDecodedMessages = flag;
		localStorage.setItem('saveDecodedMessages', flag ? 'true' : 'false');
		if (!flag) {
			await messagesDB.clearAllDecodedMessages();
		}
	}

	@autobind
	async nextPage() {
		this.loading = true;
		this.messages = (await this.currentList.readMore(10)).map(this.wrapMessage);
		this.isNextPageAvailable = !this.currentList.drained;
		this.loading = false;
		this.firstLoading = false;
	}

	buildFolderBasement(id: string, manager: IMessagesListConfigurationManager) {
		if (id === 'inbox') {
			//
		} else if (id === 'sent') {
			//
		} else if (id === 'archive') {
			//
		}
	}

	@autobind
	private wrapId(p: IMessageWithSource) {
		return `${p.msg.msgId}:${this.accountSourceMatch.get(p.source)?.account.account.address}`;
	}

	@autobind
	private wrapMessage(p: IMessageWithSource) {
		return {
			id: this.wrapId(p),
			msgId: p.msg.msgId,
			msg: p.msg,
			recipient: this.accountSourceMatch.get(p.source)?.account || null,
			reader: this.accountSourceMatch.get(p.source)!.reader,
		};
	}

	buildSourcesByFolder(folderId: string): IListSource[] {
		if (folderId === 'inbox' || folderId === 'archive') {
			return domain.accounts.accounts
				.map(account => {
					const res: IListSource[] = [];
					for (const blockchain of Object.keys(domain.blockchains)) {
						const reader = domain.blockchains[blockchain];
						const ls = this.readingSession.listSource(
							{
								blockchain,
								type: BlockchainSourceType.DIRECT,
								recipient: account.uint256Address,
								sender: null,
							},
							reader,
						);
						this.accountSourceMatch.set(ls, { account, reader });
						res.push(ls);
					}
					return res;
				})
				.flat();
		} else if (folderId === 'sent') {
			return domain.accounts.accounts
				.map(account => {
					const res: IListSource[] = [];
					for (const blockchain of Object.keys(domain.blockchains)) {
						const reader = domain.blockchains[blockchain];
						const ls = this.readingSession.listSource(
							{
								blockchain,
								type: BlockchainSourceType.DIRECT,
								recipient: account.sentAddress,
								sender: null,
							},
							reader,
						);
						this.accountSourceMatch.set(ls, { account, reader });
						res.push(ls);
					}
					return res;
				})
				.flat();
		} else {
			const tag = tags.tags.find(t => String(t.id) === folderId);
			if (!tag) {
				return [];
			}
			const contactsV = contacts.contacts.filter(c => c.tags.includes(tag.id));
			return contactsV
				.map(v =>
					domain.accounts.accounts.map(account => {
						const res: IListSource[] = [];
						for (const blockchain of Object.keys(domain.blockchains)) {
							const reader = domain.blockchains[blockchain];
							const ls = this.readingSession.listSource(
								{
									blockchain,
									type: BlockchainSourceType.DIRECT,
									recipient: account.uint256Address,
									sender: v.address,
								},
								reader,
							);
							this.accountSourceMatch.set(ls, { account, reader });
							res.push(ls);
						}
						return res;
					}),
				)
				.flat()
				.flat();
		}
	}

	@autobind
	async handleNewMessages({ messages }: { messages: IMessageWithSource[] }) {
		this.messages = messages.map(this.wrapMessage);
	}

	async openFolder(folderId: string) {
		if (this.activeFolderId === folderId) {
			if (this.activeFolderId === 'archive') {
				this.currentList.resetFilter(this.onlyDeletedFilter);
			} else if (this.activeFolderId === 'sent') {
				this.currentList.resetFilter(null);
			} else {
				this.currentList.resetFilter(this.deletedFilter);
			}
			await this.nextPage();
		} else {
			if (this.activeFolderId) {
				this.currentList.pause();
				this.currentList.off('messages', this.handleNewMessages);
			}
			this.activeFolderId = folderId;
			this.currentList = new ListSourceDrainer(new ListSourceMultiplexer(this.buildSourcesByFolder(folderId)));
			this.currentList.on('messages', this.handleNewMessages);
			if (this.activeFolderId === 'archive') {
				this.currentList.resetFilter(this.onlyDeletedFilter);
			} else if (this.activeFolderId === 'sent') {
				this.currentList.resetFilter(null);
			} else {
				this.currentList.resetFilter(this.deletedFilter);
			}
			this.firstLoading = true;
			await this.currentList.resume();
			await this.nextPage();
		}

		// this.activeFolderId = folderId;
		// if (this.initedById[folderId]) {
		// 	const result = await this.listById[folderId].configure(() => {});
		// 	if (result.type === 'success' && result.result) {
		// 		this.messages = result.result.map(this.wrapMessage);
		// 		this.isNextPageAvailable = this.listById[folderId].isNextPageAvailable();
		// 	}
		// } else {
		// 	this.listById[folderId] = new MessagesList();
		// 	this.firstLoading = true;
		// 	this.loading = true;
		// 	const result = await this.listById[folderId].configure(manager => {
		// 		manager.setFilter(entry => {
		// 			return !domain.accounts.accounts.some(acc =>
		// 				this.deletedMessageIds[acc.account.address]?.has(entry.link.msgId),
		// 			);
		// 		});
		// 		this.buildFolderBasement(folderId, manager);
		// 		for (const account of domain.accounts.accounts) {
		// 			this.inflateFolderByAccount(folderId, manager, account);
		// 			this.inflateFolderByAccount(folderId, manager, account);
		// 			this.inflateFolderByAccount(folderId, manager, account);
		// 		}
		// 	});
		// 	this.loading = false;
		// 	this.firstLoading = false;
		// 	console.log('woppy: ', result);
		// 	if (result.type === 'success' && result.result) {
		// 		this.messages = result.result.map(this.wrapMessage);
		// 		this.isNextPageAvailable = this.listById[folderId].isNextPageAvailable();
		// 	}
		// }
	}

	inflateFolderByAccount(id: string, manager: IMessagesListConfigurationManager, account: DomainAccount) {
		if (id === 'inbox') {
			for (const blockchain of Object.keys(domain.blockchains)) {
				const reader = domain.blockchains[blockchain];
				if (reader instanceof EthereumBlockchainController) {
					console.log('evm-source added');
					manager.addSource(
						new EthereumBlockchainSource(
							reader,
							{
								type: BlockchainSourceType.DIRECT,
								recipient: account.uint256Address,
								sender: null,
							},
							10000,
							10,
							{ reader, account, folderId: id },
						),
					);
				} else {
					console.log('non-source added');
					manager.addReader(
						reader,
						{
							type: BlockchainSourceType.DIRECT,
							recipient: account.uint256Address,
							sender: null,
						},
						20000,
						10,
						{ reader, account, folderId: id },
					);
				}
			}
		} else if (id === 'sent') {
			for (const blockchain of Object.keys(domain.blockchains)) {
				const reader = domain.blockchains[blockchain];
				if (reader instanceof EthereumBlockchainController) {
					manager.addSource(
						new EthereumBlockchainSource(
							reader,
							{
								type: BlockchainSourceType.DIRECT,
								recipient: Ylide.getSentAddress(account.uint256Address),
								sender: null,
							},
							10000,
							10,
							{ reader, account, folderId: id },
						),
					);
				} else {
					manager.addReader(
						reader,
						{
							type: BlockchainSourceType.DIRECT,
							recipient: Ylide.getSentAddress(account.uint256Address),
							sender: null,
						},
						20000,
						10,
						{ reader, account, folderId: id },
					);
				}
			}
		} else if (id === 'archive') {
			//
		}
	}

	async deflateFolderByAccount(id: string, list: MessagesList, account: DomainAccount) {
		//
	}
}

const mailList = new MailList();
// @ts-ignore
window.mailList = mailList;
export default mailList;
