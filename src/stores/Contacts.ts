import {IContact} from "./models/IContact";
import contactsDB from "../indexedDB/ContactsDB";
import {makeAutoObservable} from "mobx";
import fuzzysort from "fuzzysort";
import {ITag} from "./models/ITag";

class Contacts {
    contacts: IContact[] = []

    filteredContacts: IContact[] | null = []
    newContact: IContact | null = null

    filterByTag: ITag | null = null

    constructor() {
        makeAutoObservable(this)
    }

    async getContacts(): Promise<IContact[]> {
        if(!this.contacts.length) {
            await this.retrieveContacts()
        }

        return this.contacts
    }

    async retrieveContacts(): Promise<void> {
        const dbContacts = await contactsDB.retrieveAllContacts()

        this.contacts = dbContacts.reverse()
    }

    async saveContact(contact: IContact): Promise<void> {
        this.contacts.unshift(contact)
        await contactsDB.saveContact(contact)
    }

    async updateContact(contact: IContact): Promise<void> {
        this.contacts = this.contacts.map(elem => {
            if(elem.id !== contact.id) {
                return elem
            } else {
                return contact
            }
        })
        await contactsDB.saveContact(contact)
    }

    filterContacts(searchingText: string) {
        const contacts = this.contacts
        const results = fuzzysort.go(searchingText, contacts, {key: "name"})

        const resultContacts = results.map(res => res.obj)

        if (!searchingText) {
            this.setFilteredContacts([])
        } else if (resultContacts.length) {
            this.setFilteredContacts(resultContacts)
        } else {
            this.setFilteredContacts(null)
        }
    }

    setFilteredContacts(contacts: IContact[] | null) {
        this.filteredContacts = contacts
    }

    setFilterByTag(tag: ITag | null) {
        this.filterByTag = tag
    }

    generateNewContact() {
        this.newContact = {
            id: Date.now(),
            name: "",
            address: "",
            tags: []
        }
    }

    resetNewContact() {
        this.newContact = null
    }

    async deleteContact(id: number): Promise<void> {
        this.contacts = this.contacts.filter(elem => elem.id !== id)
        await contactsDB.deleteContact(id)
    }
}

const contacts = new Contacts()
export default contacts
