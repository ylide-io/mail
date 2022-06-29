import {IndexedDB} from "./IndexedDB";
import {IContact} from "../stores/models/IContact";
import {toJS} from "mobx";

class ContactsDB extends IndexedDB {
    async saveContact(contact: IContact): Promise<void> {
        const db = await this.getDB()

        await db.put('contacts', toJS({
            ...contact,
            tags: toJS(contact.tags)
        }))
    }

    async retrieveAllContacts(): Promise<IContact[]> {
        const db = await this.getDB()

        return await db.getAll('contacts')
    }

    async deleteContact(id: number): Promise<void> {
        const db = await this.getDB()

        await db.delete('contacts', id)
    }

    async clearAllContacts(): Promise<void> {
        const db = await this.getDB()

        await db.clear('contacts')
    }
}

const contactsDB = new ContactsDB()
export default contactsDB
