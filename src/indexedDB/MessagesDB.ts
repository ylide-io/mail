import {toJS} from "mobx";
import {IndexedDB} from "./IndexedDB"
import {IStoreMessage} from "../stores/models/IStoreMessage";


class MessagesDB extends IndexedDB {
    async saveMessage(msg: IStoreMessage): Promise<void> {
        const db = await this.getDB()

        const message = toJS({
            ...msg,
            decodedBody: toJS(msg.decodedBody),
            decodedTextData: toJS(msg.decodedTextData)
        })

        await db.put('messages', message)
    }

    async retrieveAllMessages(): Promise<IStoreMessage[]> {
        const db = await this.getDB()
        return await db.getAllFromIndex('messages', 'date')
    }

    async retrieveMessageById(id: string): Promise<IStoreMessage> {
        const db = await this.getDB()

        const message = await db.get('messages', id)

        if (!message) {
            throw new Error("Message not found")
        }

        return message
    }

    async clearAllMessages(): Promise<void> {
        const db = await this.getDB()

        await db.clear('messages')
    }
}

const messagesDB = new MessagesDB()
export default messagesDB
