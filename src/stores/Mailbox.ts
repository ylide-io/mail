import { makeAutoObservable } from 'mobx';

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
	recipients: IRecipient[] = [];
	subject: string = '';

	textEditorData: any | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	setRecipients(addresses: IRecipient[]) {
		this.recipients = addresses;
	}

	setSubject(str: string) {
		this.subject = str;
	}

	saveEditorData(data: any) {
		this.textEditorData = data;
	}

	resetData() {
		this.setRecipients([]);
		this.setSubject('');
		this.saveEditorData('');
	}
}

const mailbox = new Mailbox();

export default mailbox;
