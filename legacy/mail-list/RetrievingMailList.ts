import { IMessage, MessagesList } from '@ylide/sdk';
import { action, observable } from 'mobx';
import { IMailList, NewMessagesHandler } from './IMailList';

export class RetrievingMailList implements IMailList {
	@observable messages: IMessage[] = [];
	@observable isNextPageAvailable: boolean = false;
	@observable isPrevPageAvailable: boolean = false;

	@observable isTotalAccurate: boolean = true;
	@observable total: number = 0;
	@observable loading: boolean = true;

	private readonly newMessagesHandlers: NewMessagesHandler[] = [];
	list: MessagesList;

	constructor() {
		this.list = new MessagesList();
		this.list.on('windowUpdate', this.handleWindowUpdate);
		this.list.on('beforeWindowUpdate', this.updateNavigationState);
		this.list.on('afterWindowUpdate', this.updateNavigationState);
		this.list.on('stateUpdate', this.updateNavigationState);
	}

	onNewMessages(handler: NewMessagesHandler) {
		this.newMessagesHandlers.push(handler);
	}

	offNewMessages(handler: NewMessagesHandler) {
		const idx = this.newMessagesHandlers.indexOf(handler);
		if (idx > -1) {
			this.newMessagesHandlers.splice(idx, 1);
		}
	}

	@action.bound
	handleWindowUpdate() {
		this.messages = this.list.getWindow().map(w => w.link);
		this.isTotalAccurate = false;
		this.total = this.list.getWindow().length;
	}

	@action.bound
	updateNavigationState() {
		this.isNextPageAvailable = this.list.isNextPageAvailable();
		this.isPrevPageAvailable = this.list.isPreviousPageAvailable();
	}

	async firstPage() {
		this.loading = true;
		try {
			await this.list.readFirstPage();
		} finally {
			this.loading = false;
		}
	}

	async nextPage() {
		this.loading = true;
		try {
			await this.list.goNextPage();
		} finally {
			this.loading = false;
		}
		this.updateNavigationState();
	}

	async prevPage() {
		this.loading = true;
		try {
			await this.list.goPreviousPage();
		} finally {
			this.loading = false;
		}
		this.updateNavigationState();
	}
}
