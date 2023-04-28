import { toJS } from 'mobx';

import { DBTable, IContact, IndexedDB } from '../IndexedDB';

class ContactsDB extends IndexedDB {
	async saveContact(contact: IContact): Promise<void> {
		const db = await this.getDB();

		await db.put(
			DBTable.CONTACTS,
			toJS({
				...contact,
				tags: toJS(contact.tags),
			}),
		);
	}

	async retrieveAllContacts(): Promise<IContact[]> {
		const db = await this.getDB();

		return await db.getAll(DBTable.CONTACTS);
	}

	async deleteContact(id: string): Promise<void> {
		const db = await this.getDB();

		await db.delete(DBTable.CONTACTS, id);
	}

	async clearAllContacts(): Promise<void> {
		const db = await this.getDB();

		await db.clear(DBTable.CONTACTS);
	}
}

const contactsDB = new ContactsDB();
export default contactsDB;
