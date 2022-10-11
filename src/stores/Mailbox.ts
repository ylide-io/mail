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

	@observable subject: string = '';

	@observable textEditorData: any | null = null;

	constructor() {
		makeObservable(this);
	}

	resetData() {
		this.network = undefined;
		this.from = domain.accounts.accounts[0];
		this.to = [];
		this.subject = '';
		this.textEditorData = '';
	}
}

const mailbox = new Mailbox();

export default mailbox;
