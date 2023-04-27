import { IMessage, YMF } from '@ylide/sdk';
import { toJS } from 'mobx';

import {
	DBTable,
	IMessageDecodedContent,
	IMessageDecodedSerializedContent,
	IndexedDB,
	MessageDecodedTextDataType,
} from '../IndexedDB';

export class MessagesDB extends IndexedDB {
	static serializeMessageDecodedContent(content: IMessageDecodedContent): IMessageDecodedSerializedContent {
		return {
			...content,
			decodedTextData: content.decodedTextData && {
				...content.decodedTextData,
				value: content.decodedTextData.value.toString(),
			},
		};
	}

	static deserializeMessageDecodedContent(content: IMessageDecodedSerializedContent): IMessageDecodedContent {
		return {
			...content,
			decodedTextData:
				content.decodedTextData &&
				(content.decodedTextData.type === MessageDecodedTextDataType.YMF
					? {
							...content.decodedTextData,
							type: MessageDecodedTextDataType.YMF,
							value: YMF.fromYMFText(content.decodedTextData.value),
					  }
					: {
							...content.decodedTextData,
							type: MessageDecodedTextDataType.PLAIN,
							value: content.decodedTextData.value,
					  }),
		};
	}

	//

	async saveMessage(msg: IMessage): Promise<void> {
		const db = await this.getDB();
		await db.put(DBTable.MESSAGES, toJS(msg));
	}

	async retrieveAllMessages(): Promise<IMessage[]> {
		const db = await this.getDB();
		return await db.getAllFromIndex(DBTable.MESSAGES, 'createdAt');
	}

	async retrieveMessageById(id: string): Promise<IMessage | null> {
		const db = await this.getDB();
		return (await db.get(DBTable.MESSAGES, id)) || null;
	}

	async clearAllMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear(DBTable.MESSAGES);
	}

	async saveDecodedMessage(msg: IMessageDecodedSerializedContent) {
		const db = await this.getDB();
		await db.put(DBTable.DECODED_MESSAGES, toJS(msg));
	}

	async retrieveAllDecodedMessages(): Promise<IMessageDecodedSerializedContent[]> {
		const db = await this.getDB();
		return await db.getAll(DBTable.DECODED_MESSAGES);
	}

	async retrieveDecodedMessageById(id: string): Promise<IMessageDecodedSerializedContent | null> {
		const db = await this.getDB();
		return (await db.get(DBTable.DECODED_MESSAGES, id)) || null;
	}

	async clearAllDecodedMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear(DBTable.DECODED_MESSAGES);
	}

	async saveMessageRead(id: string) {
		const db = await this.getDB();
		await db.put(DBTable.READ_MESSAGES, {
			msgId: id,
			readAt: new Date().toISOString(),
		});
	}

	async saveMessagesRead(ids: string[]) {
		const db = await this.getDB();
		const tx = db.transaction(DBTable.READ_MESSAGES, 'readwrite');
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
		return (await db.get(DBTable.READ_MESSAGES, id)) ? true : false;
	}

	async getReadMessages(): Promise<string[]> {
		const db = await this.getDB();
		return (await db.getAll(DBTable.READ_MESSAGES)).map(v => v.msgId);
	}

	async clearAllReadMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear(DBTable.READ_MESSAGES);
	}

	async retrieveAllReadMessages(): Promise<string[]> {
		const db = await this.getDB();
		return (await db.getAll(DBTable.READ_MESSAGES)).map(r => r.msgId);
	}

	async retrieveAllDeletedMessages(): Promise<string[]> {
		const db = await this.getDB();
		return (await db.getAll(DBTable.DELETED_MESSAGES)).map(row => row.msgId);
	}

	async saveMessagesDeleted(ids: { id: string; accountAddress: string }[]) {
		const db = await this.getDB();
		const tx = db.transaction(DBTable.DELETED_MESSAGES, 'readwrite');
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
		const tx = db.transaction(DBTable.DELETED_MESSAGES, 'readwrite');
		await Promise.all(ids.map(v => tx.store.delete(v.id)));
		await tx.done;
	}

	async saveMessageDeleted(id: string, accountAddress: string) {
		const db = await this.getDB();
		await db.put(DBTable.DELETED_MESSAGES, {
			msgId: id,
			accountAddress,
			deletedAt: new Date().toISOString(),
		});
	}

	async restoreDeletedMessage(id: string) {
		const db = await this.getDB();
		await db.delete(DBTable.DELETED_MESSAGES, id);
	}

	async isMessageDeleted(id: string): Promise<boolean> {
		const db = await this.getDB();
		return (await db.get(DBTable.DELETED_MESSAGES, id)) ? true : false;
	}

	async clearAllDeletedMessages(): Promise<void> {
		const db = await this.getDB();
		await db.clear(DBTable.DELETED_MESSAGES);
	}
}

const messagesDB = new MessagesDB();
export default messagesDB;
