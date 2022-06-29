import {IMessage} from "../../EverStackSDK/types/IMessage";

export interface IStoreMessage extends IMessage {
    contactId?: number
    isDeleted?: boolean
}
