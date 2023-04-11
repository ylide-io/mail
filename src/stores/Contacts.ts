import fuzzysort from 'fuzzysort';
import { makeAutoObservable } from 'mobx';

import contactsDB from '../indexedDB/ContactsDB';
import { invariant } from '../utils/assert';
import { formatAddress } from '../utils/blockchain';
import { IContact } from './models/IContact';
import { ITag } from './models/ITag';

class Contacts {
	loading = false;
	loaded = false;
	contacts: IContact[] = [];

	newContact: IContact | null = null;

	filterByTag: ITag | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	async init() {
		try {
			this.loading = true;
			await this.retrieveContacts();
			this.loaded = true;
		} finally {
			this.loading = false;
		}
	}

	async retrieveContacts(): Promise<void> {
		const dbContacts = await contactsDB.retrieveAllContacts();

		this.contacts = dbContacts.reverse();
	}

	async createContact(contact: IContact): Promise<void> {
		invariant(!this.contacts.some(c => c.address === contact.address));

		this.contacts.unshift(contact);
		await contactsDB.saveContact(contact);
	}

	async updateContact(contact: IContact): Promise<void> {
		this.contacts = this.contacts.map(c => (c.address === contact.address ? contact : c));
		await contactsDB.saveContact(contact);
	}

	async deleteContact(address: string): Promise<void> {
		this.contacts = this.contacts.filter(elem => elem.address !== address);
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
