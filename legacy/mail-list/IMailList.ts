import { IMessage } from '@ylide/sdk';

export type NewMessagesHandler = (messages: IMessage[]) => void;

export interface IMailList {
	messages: IMessage[];

	isNextPageAvailable: boolean;
	isPrevPageAvailable: boolean;

	firstPage: () => Promise<void>;
	nextPage: () => Promise<void>;
	prevPage: () => Promise<void>;

	isTotalAccurate: boolean;
	total: number;

	loading: boolean;

	onNewMessages: (handler: NewMessagesHandler) => void;
	offNewMessages: (handler: NewMessagesHandler) => void;

	destroy: () => void;
}
