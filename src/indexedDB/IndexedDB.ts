import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { IMessage } from '@ylide/sdk';

import { IContact } from '../stores/models/IContact';
import { ITag } from '../stores/models/ITag';
import { IMessageDecodedContent } from './MessagesDB';

interface DBInterface extends DBSchema {
	messages: {
		value: IMessage;
		key: string;
		indexes: {
			createdAt: number;
		};
	};
	readMessages: {
		value: { msgId: string; readAt: string };
		key: string;
	};
	decodedMessages: {
		value: IMessageDecodedContent;
		key: string;
	};
	deletedMessages: {
		value: { msgId: string; accountAddress: string; deletedAt: string };
		key: string;
	};
	contacts: {
		value: IContact;
		key: string;
		indexes: {
			name: string;
			address: string;
		};
	};
	tags: {
		value: ITag;
		key: number;
		indexes: {
			name: string;
		};
	};
}

export class IndexedDB {
	db: IDBPDatabase<DBInterface> | null = null;

	private async openDB() {
		return await openDB<DBInterface>('mail-1', 1, {
			upgrade(db) {
				const messagesStore = db.createObjectStore('messages', {
					keyPath: 'msgId',
				});
				messagesStore.createIndex('createdAt', 'createdAt');

				// ----------------------

				const contactsStore = db.createObjectStore('contacts', {
					keyPath: 'address',
				});
				contactsStore.createIndex('name', 'name');
				contactsStore.add({
					name: 'ignat.ylide',
					address: '0x9B44ed2A5de91f4E9109453434825a32FF2fD6e7',
					description: 'Ylide CEO',
					tags: [1],
				});
				contactsStore.add({
					name: 'danila.ylide',
					address: '0x15a33D60283e3D20751D6740162D1212c1ad2a2d',
					description: 'Ylide CTO',
					tags: [1],
				});
				contactsStore.add({
					name: 'kirill.ylide',
					address: '0x0962C57d9e451df7905d40cb1b33F179d75f6Af0',
					description: 'Ylide COO',
					tags: [1],
				});

				// ----------------------

				const tagsStore = db.createObjectStore('tags', {
					keyPath: 'id',
				});

				tagsStore.createIndex('name', 'name');
				tagsStore.add({
					id: 1,
					name: 'Ylide Team',
					color: '#f0f0f0',
					icon: '#ylide',
				});

				// ----------------------

				db.createObjectStore('readMessages', {
					keyPath: 'msgId',
				});

				// ----------------------

				db.createObjectStore('decodedMessages', {
					keyPath: 'msgId',
				});

				// ----------------------

				db.createObjectStore('deletedMessages', {
					keyPath: 'msgId',
				});
			},
		});
	}

	protected async getDB(): Promise<IDBPDatabase<DBInterface>> {
		if (!this.db) {
			this.db = await this.openDB();
		}

		return this.db;
	}
}
