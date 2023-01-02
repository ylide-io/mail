import { toJS } from 'mobx';

import { IContact } from '../stores/models/IContact';
import { IndexedDB } from './IndexedDB';

class ContactsDB extends IndexedDB {
	async saveContact(contact: IContact): Promise<void> {
		const db = await this.getDB();

		await db.put(
			'contacts',
			toJS({
				...contact,
				tags: toJS(contact.tags),
			}),
		);
	}

	async retrieveAllContacts(): Promise<IContact[]> {
		const db = await this.getDB();

		return await db.getAll('contacts');
	}

	async deleteContact(id: string): Promise<void> {
		const db = await this.getDB();

		await db.delete('contacts', id);
	}

	async clearAllContacts(): Promise<void> {
		const db = await this.getDB();

		await db.clear('contacts');
	}
}

const contactsDB = new ContactsDB();
export default contactsDB;
