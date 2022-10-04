import { EthereumBlockchainController, EthereumBlockchainSource } from '@ylide/ethereum';
import {
	AbstractBlockchainController,
	BlockchainSource,
	GenericEntry,
	GenericSortedSource,
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
import { observable } from 'mobx';
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
	@observable messages: ILinkedMessage[] = [];
	@observable isNextPageAvailable: boolean = false;
	@observable loading: boolean = false;

	@observable saveDecodedMessages = localStorage.getItem('saveDecodedMessages') === 'true';

	@observable folderById: Record<string, IFolder> = {};
	@observable folderIds: string[] = ['inbox', 'sent', 'archive'];

	listById: Record<string, MessagesList> = {};
	initedById: Record<string, boolean> = {};

	@observable messagesContentById: Record<string, IMessageContent> = {};
	@observable decodedMessagesById: Record<string, IMessageDecodedContent> = {};
	@observable checkedMessageIds: string[] = [];

	deletedMessageIds: Record<string, Set<string>> = {};

	@observable activeFolderId: string | null = null;
	@observable globalSubscriptions: string[] = [];

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
	private wrapMessage(p: GenericEntry<IMessage, GenericSortedSource<IMessage>>) {
		return {
			id: `${p.link.msgId}:${p.source instanceof BlockchainSource ? p.source.meta.account.account.address : ''}`,
			msgId: p.link.msgId,
			msg: p.link,
			recipient: p.source instanceof BlockchainSource ? p.source.meta.account : null,
			reader: p.source instanceof BlockchainSource ? p.source.meta.reader : null,
		};
	}

	async openFolder(folderId: string) {
		if (!this.activeFolderId) {
			return;
		}
		if (this.initedById[folderId]) {
			const result = await this.listById[folderId].configure(() => {});
			if (result.type === 'success' && result.result) {
				this.messages = result.result.map(this.wrapMessage);
			}
		} else {
			this.listById[folderId] = new MessagesList();
			const result = await this.listById[folderId].configure(manager => {
				manager.setFilter(entry => {
					return !domain.accounts.accounts.some(acc =>
						this.deletedMessageIds[acc.account.address].has(entry.link.msgId),
					);
				});
				this.buildFolderBasement(folderId, manager);
				for (const account of domain.accounts.accounts) {
					this.inflateFolderByAccount(folderId, manager, account);
				}
			});
			if (result.type === 'success' && result.result) {
				this.messages = result.result.map(this.wrapMessage);
			}
		}
	}

	inflateFolderByAccount(id: string, manager: IMessagesListConfigurationManager, account: DomainAccount) {
		if (id === 'inbox') {
			for (const blockchain of Object.keys(domain.blockchains)) {
				const reader = domain.blockchains[blockchain];
				if (reader instanceof EthereumBlockchainController) {
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
