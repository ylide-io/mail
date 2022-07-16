import { openDB, DBSchema, IDBPDatabase } from "idb";
import { IMessage } from "@ylide/sdk";

import { IContact } from "../stores/models/IContact";
import { ITag } from "../stores/models/ITag";
import { IMessageDecodedContent } from "./MessagesDB";

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
        value: { msgId: string; deletedAt: string };
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
        return await openDB<DBInterface>("mail", 1, {
            upgrade(db) {
                const messagesStore = db.createObjectStore("messages", {
                    keyPath: "msgId",
                });
                messagesStore.createIndex("createdAt", "createdAt");

                // ----------------------

                const contactsStore = db.createObjectStore("contacts", {
                    keyPath: "address",
                });
                contactsStore.createIndex("name", "name");
                contactsStore.add({
                    name: "ignat.ylide",
                    address:
                        "0:9ee55e89c3b48603d34d65f67e4c638863a1a3920b79dd662d7cd8c484f77445",
                    tags: [],
                });
                contactsStore.add({
                    name: "danila.ylide",
                    address:
                        "0:81f452f5aec2263ab10116f7108a20209d5051081bb3caed34f139f976a0e279",
                    tags: [],
                });
                contactsStore.add({
                    name: "kirill.ylide",
                    address:
                        "0:9308bdf06ed5839075da88a3c86a2273075969b18e6b8ea2d120b8aed427ccf7",
                    tags: [],
                });

                // ----------------------

                const tagsStore = db.createObjectStore("tags", {
                    keyPath: "id",
                });

                tagsStore.createIndex("name", "name");

                // ----------------------

                db.createObjectStore("readMessages", {
                    keyPath: "msgId",
                });

                // ----------------------

                db.createObjectStore("decodedMessages", {
                    keyPath: "msgId",
                });

                // ----------------------

                db.createObjectStore("deletedMessages", {
                    keyPath: "msgId",
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
