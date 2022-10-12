import { IMessage, MessagesList } from '@ylide/sdk';
import { action, observable } from 'mobx';
import { IMailList, NewMessagesHandler } from './IMailList';

export class StaticMailList implements IMailList {
	private totalMessages: IMessage[] = [];

	@observable messages: IMessage[] = [];
	@observable isNextPageAvailable: boolean = false;
	@observable isPrevPageAvailable: boolean = false;

	@observable isTotalAccurate: boolean = true;
	@observable total: number = 0;
	@observable loading: boolean = true;

	private readonly newMessagesHandlers: NewMessagesHandler[] = [];

	constructor(
		private readonly readNextPage: (lastMessage: IMessage | null) => IMessage[],
		private readonly subscribeToNewMessages: (handler: NewMessagesHandler) => void,
		private readonly unsubscribeFromNewMessages: (handler: NewMessagesHandler) => void,
	) {
		this.subscribeToNewMessages(this.handleNewMessages);
	}

	destroy() {
		this.unsubscribeFromNewMessages(this.handleNewMessages);
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
	handleNewMessages(newMessages: IMessage[]) {
		this.totalMessages.unshift(...newMessages);
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
