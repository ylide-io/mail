import { makeAutoObservable } from "mobx";
import auth from "./Auth";
import messagesDB from "../indexedDB/MessagesDB";
import { IStoreMessage } from "./models/IStoreMessage";
import contacts from "./Contacts";
import { IContact } from "./models/IContact";
import fuzzysort from "fuzzysort";
import { filterAsync } from "../utils/asyncFilter";

interface filteringTypesInterface {
    unread: (arg1: IStoreMessage) => Promise<boolean>;
    read: (arg1: IStoreMessage) => Promise<boolean>;
    notArchived: (arg1: IStoreMessage) => Promise<boolean>;
    archived: (arg1: IStoreMessage) => Promise<boolean>;
    byFolder: (arg1: IStoreMessage) => Promise<boolean>;
}

class Mailer {
    sending: boolean = false;
    loading: boolean = false;
    pageSwitchLoading: boolean = false;

    saveDecodedMessages: boolean | null = null;

    messages: IStoreMessage[] = [];
    message: IStoreMessage | null = null;
    decodedMessages: IStoreMessage[] = [];
    checkedMessages: IStoreMessage[] = [];

    activeFolderId: number | null = null;
    searchingText: string = "";

    readonly messagesOnPage = 10;
    isNextPage: boolean = false;
    previousPages: IStoreMessage[][] = [];

    readonly filteringTypes: filteringTypesInterface = {
        unread: (message) => Promise.resolve(message.isUnread),
        read: (message) => Promise.resolve(!message.isUnread),
        notArchived: async (message) => Promise.resolve(!message.isDeleted),
        archived: async (message) =>
            Promise.resolve(message.isDeleted || false),
        byFolder: async (message) => {
            if (!message.contactId) return false;

            const contactsList = await contacts.getContacts();

            const contact = contactsList.find(
                (contact) => contact.id === message.contactId
            );

            if (!contact) return false;

            const foundTag = contact.tags.find(
                (tagId) => tagId === this.activeFolderId
            );

            return !!foundTag;
        },
    };

    filteringMethod: keyof filteringTypesInterface = "notArchived";

    constructor() {
        makeAutoObservable(this);
    }

    async sendMail(text: string, receiver: string): Promise<void> {
        try {
            if (!auth.wallet) throw new Error("Wallet not available");
            if (!receiver) throw new Error("Receiver must be specified");
            this.sending = true;
            const publicKey = await auth.wallet.extractPublicKeyFromAddress(
                receiver
            );
            if (!publicKey) throw new Error("Public key is non extractable");
            await auth.wallet.sendMessage(text, receiver, publicKey);
        } catch (e) {
            throw e;
        } finally {
            this.sending = false;
        }
    }

    //beforeMessage
    private async retrieveMessages({
        nextPageAfterMessage,
        beforeMessage,
    }: {
        nextPageAfterMessage?: IStoreMessage;
        beforeMessage?: IStoreMessage;
    }): Promise<{
        pageMessages: IStoreMessage[];
        isNextPage: boolean;
    }> {
        const messages = await auth.wallet?.retrieveMessageHistoryByDates({
            messagesLimit: this.messagesOnPage,
            firstMessageIdToStopSearching: beforeMessage?.id,
            nextPageAfterMessage,
        });

        if (!messages) {
            return {
                pageMessages: [],
                isNextPage: false,
            };
        }

        const decodedMessages: IStoreMessage[] = [];

        for (let elem of messages) {
            const message = (await this.findDecodedInstance(elem.id)) || elem;

            const contact = await this.findContact(
                message.decodedBody?.data?.sender
            );

            decodedMessages.push({
                ...message,
                contactId: contact?.id,
            });
        }

        let isNextPage = false;

        if (messages && messages.length === this.messagesOnPage) {
            isNextPage = await Mailer.checkIsNextPage(
                messages[messages.length - 1]
            );
        }

        return {
            pageMessages: decodedMessages || [],
            isNextPage,
        };
    }

    async retrieveMessagesPage({
        filteringType,
        beforeMessage,
        nextPageAfterMessage,
        searchingText,
    }: {
        filteringType: keyof filteringTypesInterface;
        searchingText?: string;
        beforeMessage?: IStoreMessage;
        nextPageAfterMessage?: IStoreMessage;
    }): Promise<{
        pageMessages: IStoreMessage[];
        isNextPage: boolean;
    }> {
        this.loading = true;
        let lastFetchedPage: IStoreMessage[] = [];

        //Length = messagesOnPage + 1, this additional message mean we have next page
        const fullMessages: IStoreMessage[] = [];

        while (true) {
            const { pageMessages, isNextPage } = await this.retrieveMessages({
                nextPageAfterMessage:
                    lastFetchedPage[lastFetchedPage.length - 1] ||
                    nextPageAfterMessage,
                beforeMessage,
            });
            lastFetchedPage = pageMessages;

            let filteredMessages: IStoreMessage[] = pageMessages;

            if (filteringType) {
                filteredMessages = await filterAsync(
                    pageMessages,
                    this.filteringTypes[filteringType]
                );
            }

            if (searchingText) {
                filteredMessages = this.fuzzyFilterMessages(
                    searchingText,
                    filteredMessages
                );
            }

            for (const msg of filteredMessages) {
                if (fullMessages.length === this.messagesOnPage + 1) break;
                fullMessages.push(msg);
            }

            if (!isNextPage) break;
            if (fullMessages.length === this.messagesOnPage + 1) break;
        }

        this.loading = false;
        return {
            pageMessages: fullMessages.slice(0, this.messagesOnPage),
            isNextPage: fullMessages.length === this.messagesOnPage + 1,
        };
    }

    async retrieveNewMessages(): Promise<void> {
        if (this.loading) return;
        if (this.previousPages.length) return;

        let { pageMessages } = await this.retrieveMessagesPage({
            beforeMessage: this.messages[0],
            searchingText: this.searchingText,
            filteringType: this.filteringMethod,
        });

        if (!this.isNextPage) {
            let newMessagesCounter = 0;

            for (const newMessage of pageMessages) {
                if (newMessage.id === this.messages[0].id) break;
                newMessagesCounter++;
            }

            if (
                this.messages.length + newMessagesCounter >
                this.messagesOnPage
            ) {
                this.isNextPage = true;
            }
        }

        this.messages = pageMessages;
    }

    async retrieveFirstPage(): Promise<void> {
        this.previousPages = [];
        const filteringType = this.filteringMethod;

        let { pageMessages, isNextPage } = await this.retrieveMessagesPage({
            filteringType,
            searchingText: this.searchingText,
        });

        this.messages = pageMessages;
        this.isNextPage = isNextPage;
    }

    async goNextPage(): Promise<void> {
        this.pageSwitchLoading = true;
        const lastMessage = this.messages[this.messages.length - 1];

        this.previousPages?.push(this.messages);

        const filteringType = this.filteringMethod;

        const { pageMessages, isNextPage } = await this.retrieveMessagesPage({
            searchingText: this.searchingText,
            filteringType,
            nextPageAfterMessage: lastMessage,
        });

        this.messages = pageMessages;
        this.isNextPage = isNextPage;
        this.pageSwitchLoading = false;
    }

    async goPrevPage(isNextPage?: boolean): Promise<void> {
        this.pageSwitchLoading = true;
        const prevPage = this.previousPages.pop();
        if (!prevPage) {
            await this.retrieveFirstPage();
            return;
        }
        this.messages = prevPage;
        this.isNextPage = isNextPage === false ? isNextPage : true;
        this.pageSwitchLoading = false;
    }

    filterByFolder(folderId: number | null) {
        if (!folderId) {
            this.filteringMethod = "notArchived";
            this.activeFolderId = null;
        } else {
            this.filteringMethod = "byFolder";
            this.activeFolderId = folderId;
        }
        this.retrieveFirstPage();
    }

    filterByArchived() {
        this.filteringMethod = "archived";
        this.activeFolderId = null;
        this.retrieveFirstPage();
    }

    private static async checkIsNextPage(
        lastMessage: IStoreMessage
    ): Promise<boolean> {
        const message = await auth.wallet?.retrieveMessageHistoryByDates({
            messagesLimit: 1,
            nextPageAfterMessage: lastMessage,
        });

        let isNextPage = false;

        if (message?.length) {
            isNextPage = true;
        }
        return isNextPage;
    }

    async getMessageById(id: string): Promise<void> {
        try {
            const message =
                (await this.findDecodedInstance(id)) ||
                (await auth.wallet?.retrieveMessageById(id));

            if (message) {
                const contact = await this.findContact(
                    message?.decodedBody?.data?.sender
                );

                this.message = {
                    ...message,
                    contactId: contact?.id,
                };
            } else {
                throw new Error("Message was not retreived");
            }
        } catch (e) {
            throw e;
        }
    }

    async findContact(address: string): Promise<IContact | undefined> {
        const allContacts = await contacts.getContacts();

        for (const contact of allContacts) {
            if (contact.address === address) {
                return contact;
            }
        }
    }

    private async findDecodedInstance(
        messageId: string
    ): Promise<IStoreMessage | null> {
        try {
            let message = this.decodedMessages.find(
                (msg) => msg.id === messageId
            );

            if (!message) {
                message = await messagesDB.retrieveMessageById(messageId);
                if (message.isDecoded) {
                    this.decodedMessages.push(message);
                }
            }

            return message;
        } catch (e) {
            return null;
        }
    }

    fuzzyFilterMessages(searchingText: string, messages: IStoreMessage[]) {
        const decodedMessages = messages.filter((msg) => msg.isDecoded);
        const preparedMessages = decodedMessages.map((message) =>
            this.prepareMessagesText(message)
        );
        const results = fuzzysort.go(searchingText, preparedMessages, {
            keys: ["text", "subject"],
        });
        return results.map((res) => res.obj.message);
    }

    private prepareMessagesText = (message: IStoreMessage) => {
        const textArr: string[] = [];
        message.decodedTextData?.blocks.forEach((block: any) => {
            const filteredText = block?.data?.text?.split("<br>").join(" ");
            textArr.push(filteredText);
        });
        return {
            text: textArr.join(" "),
            subject: message.decodedSubject,
            message,
        };
    };

    resetCurrentMessage(): void {
        this.message = null;
    }

    async readAndDecodeMessage(message: IStoreMessage): Promise<void> {
        await this.decodeMessage({
            ...message,
            isUnread: false,
        });
    }

    async decodeMessage(message: IStoreMessage): Promise<void> {
        try {
            const decodedData = await auth.wallet?.decodeMailText(
                message.decodedBody.data.data,
                message.decodedBody.data.nonce
            );
            if (!decodedData) throw new Error("Error decoding message");

            const { data, subject } = JSON.parse(decodedData);

            const updates = {
                decodedTextData: data,
                decodedSubject: subject,
                isDecoded: true,
            };

            const decodedMessage = {
                ...message,
                ...updates,
            };

            this.decodedMessages.push(decodedMessage);

            this.updateMessage(message.id, updates);

            await this.saveToDB(decodedMessage);
        } catch (e) {
            throw e;
        }
    }

    async readMessage(message: IStoreMessage) {
        this.updateMessage(message.id, { isUnread: false });
        await this.saveToDB({
            ...message,
            isUnread: false,
        });
    }

    async readCheckedMessage() {
        const readPromises = this.checkedMessages.map((elem) =>
            this.readMessage(elem)
        );
        await Promise.all(readPromises);
        this.checkedMessages = [];
    }

    async deleteMessage(message: IStoreMessage) {
        if (!message.isDeleted) {
            if (this.filteringMethod !== "archived") {
                this.messages = this.messages.filter(
                    (elem) => elem.id !== message.id
                );
            }
        } else {
            if (this.filteringMethod === "archived") {
                this.messages = this.messages.filter(
                    (elem) => elem.id !== message.id
                );
            }
        }

        this.updateMessage(message.id, { isDeleted: !message.isDeleted });
        await this.saveToDB({
            ...message,
            isDeleted: !message.isDeleted,
        });
    }

    async deleteCheckedMessages() {
        const deletePromises = this.checkedMessages.map((elem) =>
            this.deleteMessage(elem)
        );
        await Promise.all(deletePromises);
        this.checkedMessages = [];
        await this.reFetchMessagesToFullPage();
    }

    private async reFetchMessagesToFullPage() {
        const fromMessage = this.messages[0];

        console.log(this.messages);

        console.log(fromMessage, this.isNextPage);

        if (!fromMessage) return this.goPrevPage(this.isNextPage);

        const filteringType = this.filteringMethod;

        const { pageMessages, isNextPage } = await this.retrieveMessagesPage({
            searchingText: this.searchingText,
            filteringType,
            nextPageAfterMessage: fromMessage,
        });

        console.log(pageMessages);

        this.messages = pageMessages;
        this.isNextPage = isNextPage;
    }

    checkMessage(message: IStoreMessage, flag: boolean) {
        if (flag) {
            this.checkedMessages.push(message);
        } else {
            this.checkedMessages = this.checkedMessages.filter(
                (elem) => elem.id !== message.id
            );
        }
    }

    isMessageChecked(messageId: string) {
        return !!this.checkedMessages.find((elem) => elem.id === messageId);
    }

    async clearMessagesDB() {
        await messagesDB.clearAllMessages();
    }

    async getSaveDecodedSetting() {
        if (this.saveDecodedMessages === null) {
            const storageItem = localStorage.getItem("saveDecodedMessages");
            if (storageItem) {
                this.saveDecodedMessages = !!Number(storageItem);
            }
        }

        return this.saveDecodedMessages;
    }

    setSearchingText(text: string) {
        this.searchingText = text;
    }

    setSaveDecodedSetting(flag: boolean) {
        this.saveDecodedMessages = flag;
        localStorage.removeItem("saveDecodedMessages");
        localStorage.setItem("saveDecodedMessages", flag ? "1" : "0");
    }

    resetAllMessages() {
        this.messages = [];
        this.message = null;
        this.decodedMessages = [];
    }

    async wipeOffDecodedMessagesFromDB() {
        const dbMessages = await messagesDB.retrieveAllMessages();

        const promiseArray: Promise<void>[] = [];

        dbMessages.forEach((message) => {
            if (message.isDecoded) {
                promiseArray.push(
                    messagesDB.saveMessage({
                        ...message,
                        decodedSubject: null,
                        decodedTextData: null,
                        isDecoded: false,
                    })
                );
            }
        });

        await Promise.all(promiseArray);
    }

    private async saveToDB(message: IStoreMessage) {
        if (await this.getSaveDecodedSetting()) {
            await messagesDB.saveMessage(message);
        } else {
            await messagesDB.saveMessage({
                ...message,
                isDecoded: false,
                decodedSubject: null,
                decodedTextData: null,
            });
        }
    }

    private updateMessage(messageId: string, updates: Partial<IStoreMessage>) {
        if (this.message?.id === messageId) {
            this.message = {
                ...this.message,
                ...updates,
            };
        }

        this.messages = this.messages.map((msg) => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    ...updates,
                };
            } else {
                return msg;
            }
        });

        this.decodedMessages = this.decodedMessages.map((msg) => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    ...updates,
                };
            } else {
                return msg;
            }
        });
    }
}

const mailer = new Mailer();

export default mailer;
