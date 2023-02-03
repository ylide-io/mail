import { OutputData } from '@editorjs/editorjs';
import { EVMNetwork } from '@ylide/ethereum';
import { makeAutoObservable } from 'mobx';

import { Recipients } from '../components/recipientInput/recipientInput';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

export class OutgoingMailData {
	from?: DomainAccount = domain.accounts.activeAccounts[0];
	to: Recipients = new Recipients();
	network?: EVMNetwork;

	subject = '';
	editorData?: OutputData;

	constructor() {
		makeAutoObservable(this);
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
