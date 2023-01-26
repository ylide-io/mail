import { OutputData } from '@editorjs/editorjs';
import { EVMNetwork } from '@ylide/ethereum';
import { makeObservable, observable } from 'mobx';

import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

class Mailbox {
	@observable from?: DomainAccount;
	@observable to: string[] = [];
	@observable bcc: string[] = [];
	@observable network?: EVMNetwork;

	@observable evmBalances: Record<EVMNetwork, number> = {
		[EVMNetwork.LOCAL_HARDHAT]: 0,
		[EVMNetwork.ETHEREUM]: 0,
		[EVMNetwork.BNBCHAIN]: 0,
		[EVMNetwork.POLYGON]: 0,
		[EVMNetwork.ARBITRUM]: 0,
		[EVMNetwork.OPTIMISM]: 0,
		[EVMNetwork.AVALANCHE]: 0,
		[EVMNetwork.FANTOM]: 0,
		[EVMNetwork.KLAYTN]: 0,
		[EVMNetwork.GNOSIS]: 0,
		[EVMNetwork.AURORA]: 0,
		[EVMNetwork.CELO]: 0,
		[EVMNetwork.CRONOS]: 0,
		[EVMNetwork.MOONBEAM]: 0,
		[EVMNetwork.MOONRIVER]: 0,
		[EVMNetwork.METIS]: 0,
		[EVMNetwork.ASTAR]: 0,
	};

	@observable subject: string = '';

	@observable editorData: OutputData | undefined;

	constructor() {
		makeObservable(this);
	}

	resetData() {
		this.network = undefined;
		this.from = domain.accounts.activeAccounts[0];
		this.to = [];
		this.subject = '';
		this.editorData = undefined;
	}
}

const mailbox = new Mailbox();

export default mailbox;
