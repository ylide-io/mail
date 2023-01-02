import { EVMNetwork } from '@ylide/ethereum';
import { makeObservable, observable } from 'mobx';

import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

export interface IRecipient {
	loading: boolean;
	input: string;
	type: 'contact' | 'ns' | 'address' | 'invalid';
	address: string | null;
	isAchievable:
		| null
		| false
		| {
				type: string;
				blockchain: string | null;
		  };
	comment?: string;
}

class Mailbox {
	@observable from?: DomainAccount;
	@observable to: IRecipient[] = [];
	@observable bcc: IRecipient[] = [];
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

	@observable textEditorData: any | null = null;

	constructor() {
		makeObservable(this);
	}

	resetData() {
		this.network = undefined;
		this.from = domain.accounts.activeAccounts[0];
		this.to = [];
		this.subject = '';
		this.textEditorData = '';
	}
}

const mailbox = new Mailbox();

export default mailbox;
