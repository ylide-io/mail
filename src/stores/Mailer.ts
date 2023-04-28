import { EVMNetwork } from '@ylide/ethereum';
import {
	MessageAttachmentLinkV1,
	MessageAttachmentType,
	MessageContentV4,
	MessageSecureContext,
	SendMailResult,
	ServiceCode,
	Uint256,
	YlideIpfsStorage,
	YMF,
} from '@ylide/sdk';
import { makeAutoObservable } from 'mobx';

import messagesDB from '../indexedDB/impl/MessagesDB';
import { readFileAsArrayBuffer } from '../utils/file';
import { getEvmWalletNetwork } from '../utils/wallet';
import { analytics } from './Analytics';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

// interface filteringTypesInterface {
// 	unread: (arg1: IMessage) => Promise<boolean>;
// 	read: (arg1: IMessage) => Promise<boolean>;
// 	notArchived: (arg1: IMessage) => Promise<boolean>;
// 	archived: (arg1: IMessage) => Promise<boolean>;
// 	byFolder: (arg1: IMessage) => Promise<boolean>;
// }

class Mailer {
	saveDecodedMessages = false;
	sending: boolean = false;
	loading: boolean = false;

	pageSwitchLoading: boolean = false;

	// searchingText: string = '';
	// readonly messagesOnPage = 10;
	// isNextPage: boolean = false;
	// page: number = 1;

	// readonly filteringTypes: filteringTypesInterface = {
	// 	unread: async message => !(await messagesDB.isMessageRead(message.msgId)),
	// 	read: message => messagesDB.isMessageRead(message.msgId),
	// 	notArchived: async message => !(await messagesDB.isMessageDeleted(message.msgId)),
	// 	archived: async message => messagesDB.isMessageDeleted(message.msgId),
	// 	byFolder: async message => {
	// 		const contact = contacts.contactsByAddress[message.senderAddress];
	// 		if (!contact) {
	// 			return false;
	// 		}

	// 		const foundTag = contact.tags.find(tagId => tagId === this.activeFolderId);

	// 		return !!foundTag;
	// 	},
	// };

	// filteringMethod: keyof filteringTypesInterface = 'notArchived';

	// @observable inboxMessages: GenericEntry<IMessage, BlockchainSource>[] = [];
	// @observable sentMessages: GenericEntry<IMessage, BlockchainSource>[] = [];

	constructor() {
		makeAutoObservable(this);
	}

	async init() {
		// const dmsgs = await messagesDB.retrieveAllDecodedMessages();
		// this.decodedMessagesById = dmsgs.reduce(
		// 	(p, c) => ({
		// 		...p,
		// 		[c.msgId]: c,
		// 	}),
		// 	{},
		// );
	}

	async sendMail(
		sender: DomainAccount,
		subject: string,
		text: YMF,
		attachments: File[],
		recipients: string[],
		network?: EVMNetwork,
		feedId?: Uint256,
	): Promise<SendMailResult | null> {
		let error = false;
		analytics.mailSentAttempt();
		try {
			this.sending = true;

			const secureContext = MessageSecureContext.create();
			const ipfsStorage = new YlideIpfsStorage();

			const messageAttachments = await Promise.all(
				attachments.map(async file => {
					const buffer = await readFileAsArrayBuffer(file);
					const uint8Array = new Uint8Array(buffer);
					const encrypted = secureContext.encrypt(uint8Array);
					const uploaded = await ipfsStorage.uploadToIpfs(encrypted);

					return new MessageAttachmentLinkV1({
						type: MessageAttachmentType.LINK_V1,
						previewLink: '',
						link: `ipfs://${uploaded.hash}`,
						fileName: file.name,
						fileSize: file.size,
						isEncrypted: true,
					});
				}),
			);

			const content = new MessageContentV4({
				sendingAgentName: 'ysh',
				sendingAgentVersion: { major: 1, minor: 0, patch: 0 },
				subject,
				content: text,
				attachments: messageAttachments,
				extraBytes: new Uint8Array(0),
				extraJson: {},
			});

			if (!network && sender.wallet.factory.blockchainGroup === 'evm') {
				network = await getEvmWalletNetwork(sender.wallet);
			}

			return await domain.ylide.core.sendMessage(
				{
					wallet: sender.wallet.controller,
					sender: sender.account,
					content,
					recipients,
					secureContext,
					serviceCode: ServiceCode.MAIL,
					feedId,
				},
				{
					network,
				},
			);
		} catch (e) {
			error = true;
			throw e;
		} finally {
			if (!error) {
				analytics.mailSentSuccessful();
			}
			this.sending = false;
		}
	}

	//beforeMessage
	// private async retrieveMessages({
	// 	nextPageAfterMessage,
	// 	beforeMessage,
	// }: {
	// 	nextPageAfterMessage?: IMessage;
	// 	beforeMessage?: IMessage;
	// }): Promise<{
	// 	pageMessages: IMessage[];
	// 	isNextPage: boolean;
	// }> {
	// 	const messages = await domain.readers.everscale.retrieveMessageHistoryByDates(domain.everscaleKey.address, {
	// 		messagesLimit: this.messagesOnPage,
	// 		firstMessageIdToStopSearching: beforeMessage?.msgId,
	// 		nextPageAfterMessage,
	// 	});

	// 	if (!messages) {
	// 		return {
	// 			pageMessages: [],
	// 			isNextPage: false,
	// 		};
	// 	}

	// 	let isNextPage = false;

	// 	if (messages && messages.length === this.messagesOnPage) {
	// 		isNextPage = await Mailer.checkIsNextPage(messages[messages.length - 1]);
	// 	}

	// 	return {
	// 		pageMessages: messages || [],
	// 		isNextPage,
	// 	};
	// }

	// async retrieveMessagesPage({
	// 	filteringType,
	// 	beforeMessage,
	// 	nextPageAfterMessage,
	// 	searchingText,
	// }: {
	// 	filteringType: keyof filteringTypesInterface;
	// 	searchingText?: string;
	// 	beforeMessage?: IMessage;
	// 	nextPageAfterMessage?: IMessage;
	// }): Promise<{
	// 	pageMessages: IMessage[];
	// 	isNextPage: boolean;
	// }> {
	// 	this.loading = true;
	// 	let lastFetchedPage: IMessage[] = [];

	// 	//Length = messagesOnPage + 1, this additional message mean we have next page
	// 	const fullMessages: IMessage[] = [];

	// 	while (true) {
	// 		const { pageMessages, isNextPage } = await this.retrieveMessages({
	// 			nextPageAfterMessage: lastFetchedPage[lastFetchedPage.length - 1] || nextPageAfterMessage,
	// 			beforeMessage,
	// 		});
	// 		lastFetchedPage = pageMessages;

	// 		let filteredMessages: IMessage[] = pageMessages;

	// 		if (filteringType) {
	// 			filteredMessages = await filterAsync(pageMessages, this.filteringTypes[filteringType]);
	// 		}

	// 		if (searchingText) {
	// 			filteredMessages = this.fuzzyFilterMessages(searchingText, filteredMessages);
	// 		}

	// 		for (const msg of filteredMessages) {
	// 			if (fullMessages.length === this.messagesOnPage + 1) break;
	// 			fullMessages.push(msg);
	// 		}

	// 		if (!isNextPage) break;
	// 		if (fullMessages.length === this.messagesOnPage + 1) break;
	// 	}

	// 	this.loading = false;
	// 	return {
	// 		pageMessages: fullMessages.slice(0, this.messagesOnPage),
	// 		isNextPage: fullMessages.length === this.messagesOnPage + 1,
	// 	};
	// }

	// async retrieveNewMessages(): Promise<void> {
	// 	if (this.loading) return;

	// 	const firstMessage = this.messageIds.length ? this.messagesById[this.messageIds[0]] : null;

	// 	let { pageMessages } = await this.retrieveMessagesPage({
	// 		beforeMessage: firstMessage || undefined,
	// 		searchingText: this.searchingText,
	// 		filteringType: this.filteringMethod,
	// 	});

	// 	if (!this.isNextPage) {
	// 		let newMessagesCounter = 0;

	// 		if (firstMessage) {
	// 			for (const newMessage of pageMessages) {
	// 				if (newMessage.msgId === firstMessage.msgId) break;
	// 				newMessagesCounter++;
	// 			}
	// 		} else {
	// 			newMessagesCounter = pageMessages.length;
	// 		}

	// 		if (this.messageIds.length + newMessagesCounter > this.messagesOnPage) {
	// 			this.isNextPage = true;
	// 		}
	// 	}

	// 	for (const msg of pageMessages) {
	// 		if (!this.messagesById[msg.msgId]) {
	// 			this.messagesById[msg.msgId] = msg;
	// 		}
	// 		const mLink = this.messagesById[msg.msgId];
	// 		if (!mLink.contentLink) {
	// 			const content = await domain.readers.everscale.retrieveMessageContentByMsgId(mLink.msgId);
	// 			if (!content || content.corrupted) {
	// 				continue;
	// 			}
	// 			mLink.isContentLoaded = true;
	// 			mLink.contentLink = content;
	// 		}
	// 	}
	// 	if (firstMessage) {
	// 		for (const msgId of pageMessages.filter(m => !this.messageIds.includes(m.msgId)).map(p => p.msgId)) {
	// 			this.messageIds.unshift(msgId);
	// 		}
	// 	} else {
	// 		this.messageIds = pageMessages.map(p => p.msgId);
	// 	}
	// }

	// async retrieveFirstPage(): Promise<void> {
	// 	console.log('retrieveFirstPage');
	// 	const filteringType = this.filteringMethod;

	// 	let { pageMessages, isNextPage } = await this.retrieveMessagesPage({
	// 		filteringType,
	// 		searchingText: this.searchingText,
	// 	});

	// 	for (const msg of pageMessages) {
	// 		if (!this.messagesById[msg.msgId]) {
	// 			this.messagesById[msg.msgId] = msg;
	// 		}
	// 		const mLink = this.messagesById[msg.msgId];
	// 		if (!mLink.contentLink) {
	// 			const content = await domain.readers.everscale.retrieveMessageContentByMsgId(mLink.msgId);
	// 			if (!content || content.corrupted) {
	// 				continue;
	// 			}
	// 			mLink.isContentLoaded = true;
	// 			mLink.contentLink = content;
	// 		}
	// 	}
	// 	this.messageIds = pageMessages.map(p => p.msgId);
	// 	this.isNextPage = isNextPage;
	// }

	// async goNextPage(): Promise<void> {
	// 	this.pageSwitchLoading = true;
	// 	const lastMessage = this.messageIds.length
	// 		? this.messagesById[this.messageIds[this.messageIds.length - 1]]
	// 		: null;

	// 	const filteringType = this.filteringMethod;

	// 	const { pageMessages, isNextPage } = await this.retrieveMessagesPage({
	// 		searchingText: this.searchingText,
	// 		filteringType,
	// 		nextPageAfterMessage: lastMessage || undefined,
	// 	});

	// 	for (const msg of pageMessages) {
	// 		if (!this.messagesById[msg.msgId]) {
	// 			this.messagesById[msg.msgId] = msg;
	// 		}
	// 		const mLink = this.messagesById[msg.msgId];
	// 		if (!mLink.contentLink) {
	// 			const content = await domain.readers.everscale.retrieveMessageContentByMsgId(mLink.msgId);
	// 			if (!content || content.corrupted) {
	// 				continue;
	// 			}
	// 			mLink.isContentLoaded = true;
	// 			mLink.contentLink = content;
	// 		}
	// 	}
	// 	this.messageIds.push(...pageMessages.map(m => m.msgId));
	// 	this.page++;
	// 	this.isNextPage = isNextPage;
	// 	this.pageSwitchLoading = false;
	// }

	// async goPrevPage(isNextPage?: boolean): Promise<void> {
	// 	this.pageSwitchLoading = true;
	// 	if (this.page > 1) {
	// 		this.page--;
	// 	}
	// 	this.pageSwitchLoading = false;
	// }

	// filterByFolder(folderId: number | null) {
	// 	if (!folderId) {
	// 		this.filteringMethod = 'notArchived';
	// 		this.activeFolderId = null;
	// 	} else {
	// 		this.filteringMethod = 'byFolder';
	// 		this.activeFolderId = folderId;
	// 	}
	// 	// this.retrieveFirstPage();
	// }

	// filterByArchived() {
	// 	this.filteringMethod = 'archived';
	// 	this.activeFolderId = null;
	// 	// this.retrieveFirstPage();
	// }

	// private static async checkIsNextPage(lastMessage: IMessage): Promise<boolean> {
	// 	const message = await domain.readers.everscale.retrieveMessageHistoryByDates(domain.everscaleKey.address, {
	// 		messagesLimit: 1,
	// 		nextPageAfterMessage: lastMessage,
	// 	});

	// 	let isNextPage = false;

	// 	if (message?.length) {
	// 		isNextPage = true;
	// 	}
	// 	return isNextPage;
	// }

	// fuzzyFilterMessages(searchingText: string, messages: IMessage[]): IMessage[] {
	// 	const decodedMessages = messages.filter(msg => !!this.decodedMessagesById[msg.msgId]);
	// 	const preparedMessages = decodedMessages.map(message => this.prepareMessagesText(message.msgId));
	// 	const results = fuzzysort.go(searchingText, preparedMessages, {
	// 		keys: ['text', 'subject'],
	// 	});
	// 	return results.map(res => this.messagesById[res.obj.msgId]);
	// }

	// private prepareMessagesText = (msgId: string) => {
	// 	const textArr: string[] = [];
	// 	const decoded = this.decodedMessagesById[msgId];
	// 	decoded.decodedTextData.blocks.forEach((block: any) => {
	// 		const filteredText = block?.data?.text?.split('<br>').join(' ');
	// 		textArr.push(filteredText);
	// 	});
	// 	return {
	// 		msgId,
	// 		text: textArr.join(' '),
	// 		subject: decoded.decodedSubject,
	// 	};
	// };

	// async readAndDecodeMessage(message: GenericEntry<IMessage, BlockchainSource>): Promise<void> {
	// 	await this.decodeMessage(message);
	// }

	// async decodeMessage(pushMsg: GenericEntry<IMessage, BlockchainSource>): Promise<void> {
	// 	const reader = pushMsg.source.reader;
	// 	const recipient = domain.accounts.activeAccounts.find(
	// 		acc =>
	// 			acc.uint256Address === pushMsg.source.subject.address ||
	// 			acc.sentAddress === pushMsg.source.subject.address,
	// 	);
	// 	if (!recipient) {
	// 		return;
	// 	}

	// 	if (!pushMsg.link.contentLink) {
	// 		const content = await reader.retrieveMessageContentByMsgId(pushMsg.link.msgId);
	// 		if (!content || content.corrupted) {
	// 			throw new Error('Content is not available or corrupted');
	// 		}
	// 		pushMsg.link.isContentLoaded = true;
	// 		pushMsg.link.contentLink = content;
	// 	}
	// 	if (!pushMsg.link.contentLink) {
	// 		throw new Error('Content not retrievable');
	// 	}

	// 	const result = await domain.ylide.decryptMessageContent(
	// 		recipient.account,
	// 		pushMsg.link,
	// 		pushMsg.link.contentLink,
	// 	);
	// 	// const key = domain.connectedKeys.find(t => t.address === pushMsg.recipientAddress);
	// 	// if (!key) {
	// 	// 	throw new Error('Decryption key is not available');
	// 	// }
	// 	// const me = await key.wallet.getAuthenticatedAccount();
	// 	// if (!me) {
	// 	// 	throw new Error('Account is not connected');
	// 	// }

	// 	pushMsg.link.isContentDecrypted = true;
	// 	pushMsg.link.decryptedContent = result.decryptedContent;

	// 	this.decodedMessagesById[pushMsg.link.msgId] = {
	// 		msgId: pushMsg.link.msgId,
	// 		decodedSubject: result.subject,
	// 		decodedTextData: result.content,
	// 	};

	// 	if (this.getSaveDecodedSetting()) {
	// 		console.log('msg saved: ', pushMsg.link.msgId);
	// 		await messagesDB.saveDecodedMessage(this.decodedMessagesById[pushMsg.link.msgId]);
	// 	}
	// }

	// async readMessage(msgId: string) {
	// 	await messagesDB.saveMessageRead(msgId);
	// }

	// async readCheckedMessage() {
	// 	const readPromises = this.checkedMessageIds.map(msgId => this.readMessage(msgId));
	// 	await Promise.all(readPromises);
	// 	this.checkedMessageIds = [];
	// }

	// async deleteMessage(msgId: string) {
	// 	await messagesDB.saveMessageDeleted(msgId);
	// }

	// async deleteCheckedMessages() {
	// 	const deletePromises = this.checkedMessageIds.map(msgId => this.deleteMessage(msgId));
	// 	await Promise.all(deletePromises);
	// 	this.checkedMessageIds = [];
	// }

	// checkMessage(message: IMessage, flag: boolean) {
	// 	if (flag) {
	// 		this.checkedMessageIds.push(message.msgId);
	// 	} else {
	// 		this.checkedMessageIds = this.checkedMessageIds.filter(msgId => msgId !== message.msgId);
	// 	}
	// }

	// isMessageChecked(msgId: string) {
	// 	return !!this.checkedMessageIds.includes(msgId);
	// }

	// async clearMessagesDB() {
	// 	await messagesDB.clearAllMessages();
	// }

	// getSaveDecodedSetting() {
	// 	this.saveDecodedMessages = localStorage.getItem('saveDecodedMessages') === 'true';
	// 	return this.saveDecodedMessages;
	// }

	// setSearchingText(text: string) {
	// 	this.searchingText = text;
	// }

	// setSaveDecodedSetting(flag: boolean) {
	// 	this.saveDecodedMessages = flag;
	// 	localStorage.setItem('saveDecodedMessages', flag ? 'true' : 'false');
	// 	if (!flag) {
	// 		messagesDB.clearAllDecodedMessages();
	// 	}
	// }

	// resetAllMessages() {
	// 	this.messageIds = [];
	// 	this.checkedMessageIds = [];
	// 	this.messagesById = {};
	// 	this.decodedMessagesById = {};
	// }

	async wipeOffDecodedMessagesFromDB() {
		await messagesDB.clearAllDecodedMessages();
	}
}

//@ts-ignore
const mailer = (window.mailer = new Mailer());

export default mailer;
