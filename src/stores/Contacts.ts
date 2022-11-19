import { IContact } from './models/IContact';
import contactsDB from '../indexedDB/ContactsDB';
import { makeAutoObservable } from 'mobx';
import fuzzysort from 'fuzzysort';
import { ITag } from './models/ITag';

class Contacts {
	loading = false;
	loaded = false;
	contacts: IContact[] = [];
	contactsByAddress: Record<string, IContact> = {};

	filteredContacts: IContact[] | null = [];
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
		this.contactsByAddress = this.contacts.reduce(
			(p, c) => ({
				...p,
				[c.address]: c,
			}),
			{},
		);
	}

	async saveContact(contact: IContact): Promise<void> {
		this.contacts.unshift(contact);
		this.contactsByAddress[contact.address] = contact;
		await contactsDB.saveContact(contact);
	}

	async updateContact(contact: IContact): Promise<void> {
		await contactsDB.saveContact(contact);
	}

	filterContacts(searchingText: string) {
		const contacts = this.contacts;
		const results = fuzzysort.go(searchingText, contacts, { key: 'name' });

		const resultContacts = results.map(res => res.obj);

		if (!searchingText) {
			this.setFilteredContacts([]);
		} else if (resultContacts.length) {
			this.setFilteredContacts(resultContacts);
		} else {
			this.setFilteredContacts(null);
		}
	}

	setFilteredContacts(contacts: IContact[] | null) {
		this.filteredContacts = contacts;
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

	async deleteContact(address: string): Promise<void> {
		this.contacts = this.contacts.filter(elem => elem.address !== address);
		delete this.contactsByAddress[address];
		await contactsDB.deleteContact(address);
	}
}

const contacts = new Contacts();
export default contacts;
