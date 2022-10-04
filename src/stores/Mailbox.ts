import { makeObservable, observable } from 'mobx';

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
	@observable to: IRecipient[] = [];
	@observable bcc: IRecipient[] = [];

	@observable subject: string = '';

	@observable textEditorData: any | null = null;

	constructor() {
		makeObservable(this);
	}

	resetData() {
		this.to = [];
		this.subject = '';
		this.textEditorData = '';
	}
}

const mailbox = new Mailbox();

export default mailbox;
