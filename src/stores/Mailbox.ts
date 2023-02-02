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

export const mailbox = new Mailbox();
