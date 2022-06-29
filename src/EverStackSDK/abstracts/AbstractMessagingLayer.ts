import { IGenericAccount } from "../types/IGenericAccount";
import { IMessage, retrievingMessagesOptions } from "../types/IMessage";

export abstract class AbstractMessagingLayer {
    // wallet block
    static async isWalletAvailable(): Promise<boolean> {
        throw new Error(`Method not implemented`);
    }

    static async identifyWalletType(): Promise<string> {
        throw new Error(`Method not implemented`);
    }

    // account block
    abstract getAuth(): Promise<IGenericAccount | void>;
    abstract requestAuthentication(): Promise<null | IGenericAccount>;
    abstract requestPublicKey(): Promise<string>;
    abstract disconnectAccount(): Promise<void>;
    abstract isAddressValid(address: string): boolean;

    // message send block
    abstract sendMessage(
        text: string,
        recipient: string,
        recipientPublicKey: string
    ): Promise<void>;

    // message history block
    abstract retrieveMessageHistoryByDates(
        options?: retrievingMessagesOptions
    ): Promise<IMessage[]>;
    abstract retrieveMessageById(id: string): Promise<IMessage>;
    abstract decodeMailText(data: string, nonce: string): Promise<string>;

    abstract extractPublicKeyFromAddress(
        address: string
    ): Promise<string | null>;
}
