export interface IMessage {
    body: string;
    created_at: number;
    created_lt: string;
    dst: string;
    id: string;
    src: string;

    decodedBody: any;
    isUnread: boolean;
    isDecoded: boolean;

    decodedTextData: any | null;
    decodedSubject: string | null;
}

export interface retrievingMessagesOptions {
    firstMessageIdToStopSearching?: string
    since?: Date,
    to?: Date,
    messagesLimit?: number,
    nextPageAfterMessage?: IMessage
}
