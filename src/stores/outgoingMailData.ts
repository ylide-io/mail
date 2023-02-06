import { OutputData } from '@editorjs/editorjs';
import { EVMNetwork } from '@ylide/ethereum';
import { autorun, makeAutoObservable } from 'mobx';

import { Recipients } from '../components/recipientInput/recipientInput';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

export class OutgoingMailData {
	from?: DomainAccount;
	to: Recipients = new Recipients();
	network?: EVMNetwork;

	subject = '';
	editorData?: OutputData;

	constructor() {
		makeAutoObservable(this);

		autorun(() => {
			this.from = this.from || domain.accounts.activeAccounts[0];
		});
	}

	reset() {
		this.from = domain.accounts.activeAccounts[0];
		this.to = new Recipients();
		this.network = undefined;

		this.subject = '';
		this.editorData = undefined;
	}
}

export const globalOutgoingMailData = new OutgoingMailData();
