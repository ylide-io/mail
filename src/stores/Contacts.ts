import fuzzysort from 'fuzzysort';
import { makeAutoObservable } from 'mobx';

import contactsDB from '../indexedDB/impl/ContactsDB';
import { IContact, ITag } from '../indexedDB/IndexedDB';
import { invariant } from '../utils/assert';
import { formatAddress } from '../utils/blockchain';

class Contacts {
	contacts: IContact[] = [];

	newContact: IContact | null = null;

	filterByTag: ITag | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	init() {
		contactsDB.retrieveAllContacts().then(res => {
			this.contacts = res.reverse();
		});
	}

	async createContact(contact: IContact): Promise<void> {
		invariant(!this.contacts.some(c => formatAddress(c.address) === formatAddress(contact.address)));

		this.contacts.unshift(contact);
		await contactsDB.saveContact(contact);
	}

	async updateContact(contact: IContact): Promise<void> {
		this.contacts = this.contacts.map(c =>
			formatAddress(c.address) === formatAddress(contact.address) ? contact : c,
		);
		await contactsDB.saveContact(contact);
	}

	async deleteContact(address: string): Promise<void> {
		this.contacts = this.contacts.filter(elem => formatAddress(elem.address) !== address);
		await contactsDB.deleteContact(address);
	}

	find(options: { address?: string }) {
		const address = options.address;
		if (address) {
			return this.contacts.find(c => formatAddress(c.address) === formatAddress(address));
		}
	}

	search(term: string) {
		return fuzzysort.go(term, this.contacts, { keys: ['name', 'address'] }).map(res => res.obj);
	}

	setFilterByTag(tag: ITag | null) {
		this.filterByTag = tag;
	}

	generateNewContact() {
		this.newContact = {
			name: '',
			address: '',
			description: '',
			tags: [],
		};
	}

	resetNewContact() {
		this.newContact = null;
	}
}

const contacts = new Contacts();
export default contacts;
