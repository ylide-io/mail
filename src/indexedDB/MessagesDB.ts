import { IMessage } from '@ylide/sdk';
import { toJS } from 'mobx';

import { IMessageDecodedSerializedContent, IndexedDB } from './IndexedDB';

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

	async saveDecodedMessage(msg: IMessageDecodedSerializedContent) {
		const db = await this.getDB();
		await db.put('decodedMessages', toJS(msg));
	}

	async retrieveAllDecodedMessages(): Promise<IMessageDecodedSerializedContent[]> {
		const db = await this.getDB();
		return await db.getAll('decodedMessages');
	}

	async retrieveDecodedMessageById(id: string): Promise<IMessageDecodedSerializedContent | null> {
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

	async saveMessagesRead(ids: string[]) {
		const db = await this.getDB();
		const tx = db.transaction('readMessages', 'readwrite');
		await Promise.all(
			ids.map(id =>
				tx.store.put({
					msgId: id,
					readAt: new Date().toISOString(),
				}),
			),
		);
		await tx.done;
	}

	async isMessageRead(id: string): Promise<boolean> {
		const db = await this.getDB();
		return (await db.get('readMessages', id)) ? true : false;
	}

	async getReadMessages(): Promise<string[]> {
		const db = await this.getDB();
		return (await db.getAll('readMessages')).map(v => v.msgId);
	}

	async clearAllReadMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear('readMessages');
	}

	async retrieveAllReadMessages(): Promise<string[]> {
		const db = await this.getDB();
		return (await db.getAll('readMessages')).map(r => r.msgId);
	}

	async retrieveAllDeletedMessages(): Promise<string[]> {
		const db = await this.getDB();
		return (await db.getAll('deletedMessages')).map(row => row.msgId);
	}

	async saveMessagesDeleted(ids: { id: string; accountAddress: string }[]) {
		const db = await this.getDB();
		const tx = db.transaction('deletedMessages', 'readwrite');
		await Promise.all(
			ids.map(v =>
				tx.store.put({
					msgId: v.id,
					accountAddress: v.accountAddress,
					deletedAt: new Date().toISOString(),
				}),
			),
		);
		await tx.done;
	}

	async saveMessagesNotDeleted(ids: { id: string; accountAddress: string }[]) {
		const db = await this.getDB();
		const tx = db.transaction('deletedMessages', 'readwrite');
		await Promise.all(ids.map(v => tx.store.delete(v.id)));
		await tx.done;
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
