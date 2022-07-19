import { makeAutoObservable, toJS } from "mobx";
import messagesDB, { IMessageDecodedContent } from "../indexedDB/MessagesDB";
import contacts from "./Contacts";
import fuzzysort from "fuzzysort";
import { filterAsync } from "../utils/asyncFilter";
import {
    IMessage,
    MessageChunks,
    MessageContainer,
    MessageContentV3,
} from "@ylide/sdk";
import domain, { ConnectedKey } from "./Domain";

interface filteringTypesInterface {
    unread: (arg1: IMessage) => Promise<boolean>;
    read: (arg1: IMessage) => Promise<boolean>;
    notArchived: (arg1: IMessage) => Promise<boolean>;
    archived: (arg1: IMessage) => Promise<boolean>;
    byFolder: (arg1: IMessage) => Promise<boolean>;
}

class Mailer {
    sending: boolean = false;
    loading: boolean = false;
    pageSwitchLoading: boolean = false;

    saveDecodedMessages = false;

    messagesById: Record<string, IMessage> = {};
    decodedMessagesById: Record<string, IMessageDecodedContent> = {};

    messageIds: string[] = [];
    checkedMessageIds: string[] = [];

    activeFolderId: number | null = null;
    searchingText: string = "";

    readonly messagesOnPage = 10;
    isNextPage: boolean = false;
    page: number = 1;

    readonly filteringTypes: filteringTypesInterface = {
        unread: async (message) =>
            !(await messagesDB.isMessageRead(message.msgId)),
        read: (message) => messagesDB.isMessageRead(message.msgId),
        notArchived: async (message) =>
            !(await messagesDB.isMessageDeleted(message.msgId)),
        archived: async (message) => messagesDB.isMessageDeleted(message.msgId),
        byFolder: async (message) => {
            const contact = contacts.contactsByAddress[message.senderAddress];
            if (!contact) {
                return false;
            }

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

    async init() {
        const dmsgs = await messagesDB.retrieveAllDecodedMessages();
        this.decodedMessagesById = dmsgs.reduce(
            (p, c) => ({
                ...p,
                [c.msgId]: c,
            }),
            {}
        );
        console.log(
            "this.decodedMessagesById: ",
            toJS(this.decodedMessagesById)
        );
    }

    async sendMail(
        sender: ConnectedKey,
        subject: string,
        text: string,
        receiver: string
    ): Promise<void> {
        try {
            if (!receiver) throw new Error("Receiver must be specified");
            this.sending = true;
            const publicKey = await sender.reader.extractPublicKeyFromAddress(
                receiver
            );
            if (!publicKey)
                throw new Error("Recipient has no registered public key");
            await sender.key.execute("send mail", async (keypair) => {
                const content = MessageContentV3.plain(subject, text);
                await sender.sender.sendMessage(
                    [0, 0, 0, 1],
                    keypair,
                    content,
                    [
                        {
                            address: receiver,
                            publicKey,
                        },
                    ]
                );
            });
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
        nextPageAfterMessage?: IMessage;
        beforeMessage?: IMessage;
    }): Promise<{
        pageMessages: IMessage[];
        isNextPage: boolean;
    }> {
        console.log("retrieveMessages", {
            nextPageAfterMessage,
            beforeMessage,
        });
        const messages =
            await domain.readers.everscale.retrieveMessageHistoryByDates(
                domain.everscaleKey.address,
                {
                    messagesLimit: this.messagesOnPage,
                    firstMessageIdToStopSearching: beforeMessage?.msgId,
                    nextPageAfterMessage,
                }
            );

        console.log("messages: ", messages);

        if (!messages) {
            return {
                pageMessages: [],
                isNextPage: false,
            };
        }

        let isNextPage = false;

        if (messages && messages.length === this.messagesOnPage) {
            isNextPage = await Mailer.checkIsNextPage(
                messages[messages.length - 1]
            );
        }

        return {
            pageMessages: messages || [],
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
        beforeMessage?: IMessage;
        nextPageAfterMessage?: IMessage;
    }): Promise<{
        pageMessages: IMessage[];
        isNextPage: boolean;
    }> {
        console.log("retrieveMessagesPage", {
            filteringType,
            beforeMessage,
            nextPageAfterMessage,
            searchingText,
        });
        this.loading = true;
        let lastFetchedPage: IMessage[] = [];

        //Length = messagesOnPage + 1, this additional message mean we have next page
        const fullMessages: IMessage[] = [];

        while (true) {
            const { pageMessages, isNextPage } = await this.retrieveMessages({
                nextPageAfterMessage:
                    lastFetchedPage[lastFetchedPage.length - 1] ||
                    nextPageAfterMessage,
                beforeMessage,
            });
            lastFetchedPage = pageMessages;

            let filteredMessages: IMessage[] = pageMessages;

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
        console.log("retrieveNewMessages");
        if (this.loading) return;

        const firstMessage = this.messageIds.length
            ? this.messagesById[this.messageIds[0]]
            : null;

        let { pageMessages } = await this.retrieveMessagesPage({
            beforeMessage: firstMessage || undefined,
            searchingText: this.searchingText,
            filteringType: this.filteringMethod,
        });

        if (!this.isNextPage) {
            let newMessagesCounter = 0;

            if (firstMessage) {
                for (const newMessage of pageMessages) {
                    if (newMessage.msgId === firstMessage.msgId) break;
                    newMessagesCounter++;
                }
            } else {
                newMessagesCounter = pageMessages.length;
            }

            if (
                this.messageIds.length + newMessagesCounter >
                this.messagesOnPage
            ) {
                this.isNextPage = true;
            }
        }

        for (const msg of pageMessages) {
            this.messagesById[msg.msgId] = msg;
        }
        if (firstMessage) {
            for (const msgId of pageMessages
                .filter((m) => !this.messageIds.includes(m.msgId))
                .map((p) => p.msgId)) {
                this.messageIds.unshift(msgId);
            }
        } else {
            this.messageIds = pageMessages.map((p) => p.msgId);
        }
    }

    async retrieveFirstPage(): Promise<void> {
        console.log("retrieveFirstPage");
        const filteringType = this.filteringMethod;

        let { pageMessages, isNextPage } = await this.retrieveMessagesPage({
            filteringType,
            searchingText: this.searchingText,
        });

        for (const msg of pageMessages) {
            this.messagesById[msg.msgId] = msg;
        }
        this.messageIds = pageMessages.map((p) => p.msgId);
        this.isNextPage = isNextPage;
    }

    async goNextPage(): Promise<void> {
        this.pageSwitchLoading = true;
        const lastMessage = this.messageIds.length
            ? this.messagesById[this.messageIds[this.messageIds.length - 1]]
            : null;

        const filteringType = this.filteringMethod;

        const { pageMessages, isNextPage } = await this.retrieveMessagesPage({
            searchingText: this.searchingText,
            filteringType,
            nextPageAfterMessage: lastMessage || undefined,
        });

        for (const msg of pageMessages) {
            this.messagesById[msg.msgId] = msg;
        }
        this.messageIds.push(...pageMessages.map((m) => m.msgId));
        this.page++;
        this.isNextPage = isNextPage;
        this.pageSwitchLoading = false;
    }

    async goPrevPage(isNextPage?: boolean): Promise<void> {
        this.pageSwitchLoading = true;
        if (this.page > 1) {
            this.page--;
        }
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
        lastMessage: IMessage
    ): Promise<boolean> {
        const message =
            await domain.readers.everscale.retrieveMessageHistoryByDates(
                domain.everscaleKey.address,
                {
                    messagesLimit: 1,
                    nextPageAfterMessage: lastMessage,
                }
            );

        let isNextPage = false;

        if (message?.length) {
            isNextPage = true;
        }
        return isNextPage;
    }

    fuzzyFilterMessages(
        searchingText: string,
        messages: IMessage[]
    ): IMessage[] {
        const decodedMessages = messages.filter(
            (msg) => !!this.decodedMessagesById[msg.msgId]
        );
        const preparedMessages = decodedMessages.map((message) =>
            this.prepareMessagesText(message.msgId)
        );
        const results = fuzzysort.go(searchingText, preparedMessages, {
            keys: ["text", "subject"],
        });
        return results.map((res) => this.messagesById[res.obj.msgId]);
    }

    private prepareMessagesText = (msgId: string) => {
        const textArr: string[] = [];
        const decoded = this.decodedMessagesById[msgId];
        decoded.decodedTextData.blocks.forEach((block: any) => {
            const filteredText = block?.data?.text?.split("<br>").join(" ");
            textArr.push(filteredText);
        });
        return {
            msgId,
            text: textArr.join(" "),
            subject: decoded.decodedSubject,
        };
    };

    async readAndDecodeMessage(message: IMessage): Promise<void> {
        await this.decodeMessage(message);
    }

    async decodeMessage(pushMsg: IMessage): Promise<void> {
        try {
            if (!pushMsg.contentLink) {
                const content =
                    await domain.readers.everscale.retrieveMessageContentByMsgId(
                        pushMsg.msgId
                    );
                if (!content || content.corrupted) {
                    throw new Error("Content is not available or corrupted");
                }
                Object.assign(pushMsg, {
                    isContentLoaded: true,
                    contentLink: content,
                });
            }
            if (!pushMsg.contentLink) {
                throw new Error("Content not retrievable");
            }
            if (!pushMsg.isContentDecrypted) {
                const key = domain.connectedKeys.find(
                    (t) => t.address === pushMsg.recipientAddress
                );
                if (!key) {
                    throw new Error("Decryption key is not available");
                }
                const unpackedContent =
                    await MessageChunks.unpackContentFromChunks([
                        pushMsg.contentLink.content,
                    ]);
                let symmKey;
                await key.key.execute("read mail", async (keypair) => {
                    symmKey = keypair.decrypt(
                        pushMsg.key,
                        unpackedContent.publicKey
                    );
                });
                if (!symmKey) {
                    throw new Error("Decryption key is not accessable");
                }
                const content = MessageContainer.decodeRawContent(
                    unpackedContent.content,
                    symmKey
                );
                Object.assign(pushMsg, {
                    isContentDecrypted: true,
                    decryptedContent: content,
                });
            }
            if (!pushMsg.isContentDecrypted) {
                throw new Error("Content not decryptable");
            }

            const content = MessageContainer.messageContentFromBytes(
                pushMsg.decryptedContent!
            );

            this.decodedMessagesById[pushMsg.msgId] = {
                msgId: pushMsg.msgId,
                decodedSubject: content.subject,
                decodedTextData: content.content,
            };

            if (this.getSaveDecodedSetting()) {
                console.log("msg saved: ", pushMsg.msgId);
                await messagesDB.saveDecodedMessage(
                    this.decodedMessagesById[pushMsg.msgId]
                );
            }
        } catch (e) {
            throw e;
        }
    }

    async readMessage(msgId: string) {
        await messagesDB.saveMessageRead(msgId);
    }

    async readCheckedMessage() {
        const readPromises = this.checkedMessageIds.map((msgId) =>
            this.readMessage(msgId)
        );
        await Promise.all(readPromises);
        this.checkedMessageIds = [];
    }

    async deleteMessage(msgId: string) {
        await messagesDB.saveMessageDeleted(msgId);
    }

    async deleteCheckedMessages() {
        const deletePromises = this.checkedMessageIds.map((msgId) =>
            this.deleteMessage(msgId)
        );
        await Promise.all(deletePromises);
        this.checkedMessageIds = [];
    }

    checkMessage(message: IMessage, flag: boolean) {
        if (flag) {
            this.checkedMessageIds.push(message.msgId);
        } else {
            this.checkedMessageIds = this.checkedMessageIds.filter(
                (msgId) => msgId !== message.msgId
            );
        }
    }

    isMessageChecked(msgId: string) {
        return !!this.checkedMessageIds.includes(msgId);
    }

    async clearMessagesDB() {
        await messagesDB.clearAllMessages();
    }

    getSaveDecodedSetting() {
        this.saveDecodedMessages =
            localStorage.getItem("saveDecodedMessages") === "true";
        return this.saveDecodedMessages;
    }

    setSearchingText(text: string) {
        this.searchingText = text;
    }

    setSaveDecodedSetting(flag: boolean) {
        this.saveDecodedMessages = flag;
        localStorage.setItem("saveDecodedMessages", flag ? "true" : "false");
        if (!flag) {
            messagesDB.clearAllDecodedMessages();
        }
    }

    resetAllMessages() {
        this.messageIds = [];
        this.checkedMessageIds = [];
        this.messagesById = {};
        this.decodedMessagesById = {};
    }

    async wipeOffDecodedMessagesFromDB() {
        await messagesDB.clearAllDecodedMessages();
    }
}

//@ts-ignore
const mailer = (window.mailer = new Mailer());

export default mailer;
