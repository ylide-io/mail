import { OutputData } from '@editorjs/editorjs';
import { EVMNetwork } from '@ylide/ethereum';
import { autorun, makeAutoObservable } from 'mobx';

import { Recipients } from '../components/recipientInput/recipientInput';
import { isEmptyEditorJsData } from '../utils/mail';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

export class OutgoingMailData {
	sending = false;

	from?: DomainAccount;
	to: Recipients = new Recipients();
	network?: EVMNetwork;

	subject = '';
	editorData?: OutputData;
	plainTextData: string = '';

	attachments: File[] = [];

	constructor() {
		makeAutoObservable(this);

		autorun(() => {
			this.from =
				this.from && domain.accounts.activeAccounts.includes(this.from)
					? this.from
					: domain.accounts.activeAccounts[0];
		});
	}

	get hasEditorData() {
		return !isEmptyEditorJsData(this.editorData);
	}

	get hasPlainTextData() {
		return !!this.plainTextData;
	}

	reset(data?: OutgoingMailData) {
		this.from = data?.from || domain.accounts.activeAccounts[0];
		this.to = data?.to || new Recipients();
		this.network = data?.network;

		this.subject = data?.subject || '';
		this.editorData = data?.editorData;
		this.plainTextData = data?.plainTextData || '';

		this.attachments = data?.attachments || [];
	}
}

export const globalOutgoingMailData = new OutgoingMailData();
