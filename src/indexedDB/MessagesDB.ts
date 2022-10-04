import { toJS } from 'mobx';
import { IMessage } from '@ylide/sdk';
import { IndexedDB } from './IndexedDB';

export interface IMessageDecodedContent {
	msgId: string;
	decodedTextData: any | null;
	decodedSubject: string | null;
}

class MessagesDB extends IndexedDB {
	async saveMessage(msg: IMessage): Promise<void> {
		const db = await this.getDB();
		await db.put('messages', toJS(msg));
	}

	async retrieveAllMessages(): Promise<IMessage[]> {
		const db = await this.getDB();
		return await db.getAllFromIndex('messages', 'createdAt');
	}

	async retrieveMessageById(id: string): Promise<IMessage | null> {
		const db = await this.getDB();
		return (await db.get('messages', id)) || null;
	}

	async clearAllMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear('messages');
	}

	async saveDecodedMessage(msg: IMessageDecodedContent) {
		const db = await this.getDB();
		await db.put('decodedMessages', toJS(msg));
	}

	async retrieveAllDecodedMessages(): Promise<IMessageDecodedContent[]> {
		const db = await this.getDB();
		return await db.getAll('decodedMessages');
	}

	async retrieveDecodedMessageById(id: string): Promise<IMessageDecodedContent | null> {
		const db = await this.getDB();
		return (await db.get('decodedMessages', id)) || null;
	}

	async clearAllDecodedMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear('decodedMessages');
	}

	async saveMessageRead(id: string) {
		const db = await this.getDB();
		await db.put('readMessages', {
			msgId: id,
			readAt: new Date().toISOString(),
		});
	}

	async isMessageRead(id: string): Promise<boolean> {
		const db = await this.getDB();
		return (await db.get('readMessages', id)) ? true : false;
	}

	async clearAllReadMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear('readMessages');
	}

	async retrieveAllReadMessages(): Promise<string[]> {
		const db = await this.getDB();
		return (await db.getAll('readMessages')).map(r => r.msgId);
	}

	async retrieveAllDeletedMessages(): Promise<Record<string, string[]>> {
		const db = await this.getDB();
		return (await db.getAll('deletedMessages')).reduce(
			(p, c) => ({
				...p,
				[c.accountAddress]: (p[c.accountAddress] || []).concat([c.msgId]),
			}),
			{} as Record<string, string[]>,
		);
	}

	async saveMessageDeleted(id: string, accountAddress: string) {
		const db = await this.getDB();
		await db.put('deletedMessages', {
			msgId: id,
			accountAddress,
			deletedAt: new Date().toISOString(),
		});
	}

	async restoreDeletedMessage(id: string) {
		const db = await this.getDB();
		await db.delete('deletedMessages', id);
	}

	async isMessageDeleted(id: string): Promise<boolean> {
		const db = await this.getDB();
		return (await db.get('deletedMessages', id)) ? true : false;
	}

	async clearAllDeletedMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear('deletedMessages');
	}
}

const messagesDB = new MessagesDB();
export default messagesDB;
