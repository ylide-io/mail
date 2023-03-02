import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { MessageContentV3, SendMailResult, ServiceCode } from '@ylide/sdk';
import { makeAutoObservable } from 'mobx';

import messagesDB from '../indexedDB/MessagesDB';
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
		text: string,
		recipients: string[],
		network?: EVMNetwork,
	): Promise<SendMailResult | null> {
		let error = false;
		analytics.mailSentAttempt();
		try {
			this.sending = true;
			const content = MessageContentV3.plain(subject, text);

			if (!network && sender.wallet.factory.blockchainGroup === 'evm') {
				const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map((network: EVMNetwork) => ({
					name: EVM_NAMES[network],
					network: Number(network) as EVMNetwork,
				}));
				const blockchainName = await sender.wallet.controller.getCurrentBlockchain();
				network = evmNetworks.find(n => n.name === blockchainName)?.network;
			}

			return await domain.ylide.core.sendMessage(
				{
					wallet: sender.wallet.controller,
					sender: sender.account,
					content,
					recipients,
					serviceCode: ServiceCode.MAIL,
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

	async wipeOffDecodedMessagesFromDB() {
		await messagesDB.clearAllDecodedMessages();
	}
}

//@ts-ignore
const mailer = (window.mailer = new Mailer());

export default mailer;
