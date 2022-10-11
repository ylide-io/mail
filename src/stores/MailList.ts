import { EthereumBlockchainController, EthereumBlockchainSource } from '@ylide/ethereum';
import {
	AbstractBlockchainController,
	BlockchainSource,
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
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

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
	readingSession: SourceReadingSession = new SourceReadingSession();

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

	constructor() {
		makeObservable(this);
	}

	checkMessage(message: ILinkedMessage, flag: boolean) {
		if (flag) {
			this.checkedMessageIds.push(message.msgId);
		} else {
			this.checkedMessageIds = this.checkedMessageIds.filter(msgId => msgId !== message.msgId);
		}
	}

	isMessageChecked(msgId: string) {
		return !!this.checkedMessageIds.includes(msgId);
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

	setSaveDecodedSetting(flag: boolean) {
		this.saveDecodedMessages = flag;
		localStorage.setItem('saveDecodedMessages', flag ? 'true' : 'false');
		if (!flag) {
			messagesDB.clearAllDecodedMessages();
		}
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

	@autobind
	async nextPage() {
		this.loading = true;
		this.messages = (await this.currentList.readMore(10)).map(this.wrapMessage);
		this.isNextPageAvailable = !this.currentList.drained;
		// const result = await this.listById[this.activeFolderId!].goNextPage();
		// if (result.type === 'success' && result.result) {
		// 	this.messages = result.result.map(this.wrapMessage);
		// 	this.isNextPageAvailable = this.listById[this.activeFolderId!].isNextPageAvailable();
		// }
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
	private wrapMessage(p: IMessageWithSource) {
		return {
			id: `${p.msg.msgId}:${p.source instanceof BlockchainSource ? p.source.meta.account.account.address : ''}`,
			msgId: p.msg.msgId,
			msg: p.msg,
			recipient: p.source instanceof BlockchainSource ? p.source.meta.account : null,
			reader: p.source instanceof BlockchainSource ? p.source.meta.reader : null,
		};
	}

	buildSourcesByFolder(folderId: string): IListSource[] {
		if (folderId === 'inbox') {
			return domain.accounts.accounts
				.map(acc => {
					const res: IListSource[] = [];
					for (const blockchain of Object.keys(domain.blockchains)) {
						const reader = domain.blockchains[blockchain];
						res.push(
							this.readingSession.listSource(
								{
									blockchain,
									type: BlockchainSourceType.DIRECT,
									recipient: acc.uint256Address,
									sender: null,
								},
								reader,
							),
						);
					}
					return res;
				})
				.flat();
		} else {
			return [];
		}
	}

	async openFolder(folderId: string) {
		if (this.activeFolderId === folderId) {
			this.currentList.resetFilter(null);
			await this.nextPage();
		} else {
			if (this.activeFolderId) {
				this.currentList.pause();
			}
			this.currentList = new ListSourceDrainer(new ListSourceMultiplexer(this.buildSourcesByFolder(folderId)));
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
export default mailList;
