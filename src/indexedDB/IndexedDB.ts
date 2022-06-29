import { openDB, DBSchema, IDBPDatabase } from "idb";
import { IContact } from "../stores/models/IContact";
import { ITag } from "../stores/models/ITag";
import { IStoreMessage } from "../stores/models/IStoreMessage";

interface DBInterface extends DBSchema {
    messages: {
        value: IStoreMessage;
        key: string;
        indexes: {
            date: number;
        };
    };
    contacts: {
        value: IContact;
        key: number;
        indexes: {
            name: string;
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
        return await openDB<DBInterface>("ever-messaging", 1, {
            upgrade(db) {
                const messagesStore = db.createObjectStore("messages", {
                    keyPath: "id",
                });
                messagesStore.createIndex("date", "created_at");

                const contactsStore = db.createObjectStore("contacts", {
                    keyPath: "id",
                });
                contactsStore.add({
                    name: "ignat.ylide",
                    address:
                        "0:9ee55e89c3b48603d34d65f67e4c638863a1a3920b79dd662d7cd8c484f77445",
                    tags: [],
                    id: 1,
                });
                contactsStore.add({
                    name: "danila.ylide",
                    address:
                        "0:81f452f5aec2263ab10116f7108a20209d5051081bb3caed34f139f976a0e279",
                    tags: [],
                    id: 2,
                });
                contactsStore.add({
                    name: "kirill.ylide",
                    address:
                        "0:9308bdf06ed5839075da88a3c86a2273075969b18e6b8ea2d120b8aed427ccf7",
                    tags: [],
                    id: 3,
                });

                contactsStore.createIndex("name", "name");

                const tagsStore = db.createObjectStore("tags", {
                    keyPath: "id",
                });

                tagsStore.createIndex("name", "name");
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
