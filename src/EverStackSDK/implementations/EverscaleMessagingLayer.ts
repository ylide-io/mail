import { AbstractMessagingLayer } from "../abstracts/AbstractMessagingLayer";
import { IMessage, retrievingMessagesOptions } from "../types/IMessage";
import { IGenericAccount } from "../types/IGenericAccount";
import {
    Address,
    Contract,
    ProviderRpcClient,
} from "everscale-inpage-provider";
import auth from "../../stores/Auth";
import { ContractOptions } from "../types/Contract";
import {
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
    DEV_CONTRACT_ABI,
    DEV_CONTRACT_ADDRESS,
} from "../contracts/EverscaleContract";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { EverscaleStandaloneClient } from "everscale-standalone-client";
import core from "everscale-standalone-client/core";

export class EverscaleMessagingLayer extends AbstractMessagingLayer {
    ever = new ProviderRpcClient();
    standalone!: EverscaleStandaloneClient;
    apollo = new ApolloClient({
        cache: new InMemoryCache(),
        uri: "https://eri01.main.everos.dev/graphql",
    });
    ensureSelf: Promise<void>;

    readonly MESSAGES_FETCH_LIMIT = 50;

    readonly contract: Contract<any> | null = null;

    constructor(props?: ContractOptions) {
        super();

        let contractAbi = props?.abi || CONTRACT_ABI;
        let contractAddress = new Address(props?.address || CONTRACT_ADDRESS);

        if (props?.dev) {
            contractAbi = props?.abi || DEV_CONTRACT_ABI;
            contractAddress = new Address(
                props?.address || DEV_CONTRACT_ADDRESS
            );

            this.apollo = new ApolloClient({
                cache: new InMemoryCache(),
                uri: "http://localhost/graphql",
            });
        }

        this.contract = new this.ever.Contract(contractAbi, contractAddress);

        if (!this.contract) throw new Error(`Error contract implementing`);

        this.ensureSelf = EverscaleStandaloneClient.create({
            connection: "mainnet",
        }).then((standalone) => {
            this.standalone = standalone;
        });
    }

    // wallet block
    static isWalletAvailable(): Promise<boolean> {
        return new ProviderRpcClient().hasProvider();
    }

    static async identifyWalletType(): Promise<string> {
        return "inpage-provider";
    }

    // account block
    async getAuth(): Promise<IGenericAccount | void> {
        await this.ensureSelf;
        await this.ever.ensureInitialized();
        const providerState = await this.ever.getProviderState();
        if (providerState.permissions.accountInteraction) {
            return providerState.permissions.accountInteraction;
        }
    }

    async requestAuthentication(): Promise<null | IGenericAccount> {
        const { accountInteraction } = await this.ever.requestPermissions({
            permissions: ["basic", "accountInteraction"],
        });
        if (accountInteraction) {
            return accountInteraction;
        } else {
            throw new Error("Not authenticated");
        }
    }

    requestPublicKey(): Promise<string> {
        throw new Error("Not implemented");
    }

    async disconnectAccount(): Promise<void> {
        await this.ever.disconnect();
    }

    async extractPublicKeyFromAddress(
        addressStr: string
    ): Promise<string | null> {
        const nt = core.nekoton;
        await core.ensureNekotonLoaded();
        const address = new Address(addressStr);
        const boc = await this.ever.getFullContractState({ address });
        if (!boc.state) {
            return null;
        }
        try {
            const pk = nt.extractPublicKey(boc.state.boc);
            return pk;
        } catch (err) {
            return null;
        }
    }

    // message send block
    async sendMessage(
        text: string,
        recipient: string,
        recipientPublicKey: string
    ): Promise<void> {
        const results = await this.ever.encryptData({
            publicKey: auth.account!.publicKey,
            recipientPublicKeys: [recipientPublicKey],
            algorithm: "ChaCha20Poly1305",
            data: Buffer.from(text, "utf-8").toString("base64"),
        });

        const data = results[0].data;
        const nonce = results[0].nonce;

        const contract = await this.contract;

        const transaction = await contract!.methods
            //@ts-ignore
            .sendMail({ recipient, data, nonce })
            .sendWithResult({
                from: auth.account!.address,
                amount: "1000000000",
                bounce: false,
            });

        console.log("transaction: ", transaction);
        alert("Successfully sent!");
    }

    // message history block
    //Query messages by interval options.since (included) - options.to (excluded)
    async retrieveMessageHistoryByDates(
        options?: retrievingMessagesOptions
    ): Promise<IMessage[]> {
        const sinceDate = options?.since?.getTime()
            ? options?.since?.getTime() - 1
            : null;
        let untilDate = options?.to?.getTime() || null;

        const fullMessages: IMessage[] = [];

        while (true) {
            const queryResults = await this.queryMessagesList(
                sinceDate,
                untilDate,
                {
                    nextPageAfterMessage: options?.nextPageAfterMessage,
                    messagesLimit: options?.messagesLimit,
                }
            );
            const messages: IMessage[] = queryResults.data.messages;

            if (!messages.length) break;

            let foundDuplicate = false;

            fullMessages.push(
                ...(await Promise.all(
                    messages.map(async (m) => {
                        if (m.id === options?.firstMessageIdToStopSearching) {
                            foundDuplicate = true;
                        }
                        return this.formatMessage(m);
                    })
                ))
            );

            if (foundDuplicate) break;
            if (messages.length < this.MESSAGES_FETCH_LIMIT) break;

            untilDate = messages[0].created_at * 1000;
        }

        return fullMessages;
    }

    async retrieveMessageById(id: string): Promise<IMessage> {
        const queryResult = await this.apollo.query({
            query: gql`
                    query {
                      messages(
                        filter: {
                          id: { eq: "${id}" },
                          msg_type: { eq: 2 },
                          src: { eq: "${this.contract?.address.toString()}" },
                        }
                      ) {
                        body
                        id
                        src
                        created_at
                        created_lt
                        dst
                      }
                    }`,
        });

        const message = queryResult.data.messages[0];

        return await this.formatMessage(message);
    }

    private formatMessage = async (message: any): Promise<IMessage> => ({
        ...message,
        decodedBody: await this.decodeMessageBody(message.body),
        created_at: message.created_at * 1000,
        isUnread: true,
        isDecoded: false,
    });

    async decodeMailText(
        sender: string,
        data: string,
        nonce: string
    ): Promise<string> {
        if (!auth.account) {
            throw new Error("No account authenticated");
        }
        try {
            const senderPublicKey = await this.extractPublicKeyFromAddress(
                sender
            );
            if (!senderPublicKey) {
                throw new Error("Error decrypting message text");
            }
            const decryptedText = await this.ever.decryptData({
                algorithm: "ChaCha20Poly1305",
                data: data,
                nonce: nonce,
                recipientPublicKey: auth.account.publicKey,
                sourcePublicKey: senderPublicKey,
            });
            if (decryptedText) {
                return Buffer.from(decryptedText, "base64").toString("utf8");
            } else {
                throw new Error("Error decrypting message text");
            }
        } catch (e) {
            throw e;
        }
    }

    isAddressValid(address: string): boolean {
        if (address.length !== 66) {
            return false;
        } else if (!address.includes(":")) {
            return false;
        }

        const splitAddress = address.split(":");

        if (splitAddress[0] !== "0") {
            return false;
        }

        if (splitAddress[1].includes("_")) return false;

        const regExp = new RegExp("^[^\\W]+$");

        return regExp.test(splitAddress[1]);
    }

    private async decodeMessageBody(body: string) {
        try {
            return await this.ever.rawApi.decodeEvent({
                abi: JSON.stringify(JSON.parse(this.contract?.abi || "")),
                body: body,
                event: "MailSent",
            });
        } catch (e) {
            console.log("Error decoding message", e);
        }
    }

    //Query messages by interval sinceDate(excluded) - untilDate (excluded)
    private async queryMessagesList(
        sinceDate: number | null,
        untilDate: number | null,
        options: {
            messagesLimit?: number;
            nextPageAfterMessage?: IMessage;
        }
    ) {
        const receiverAddress = auth.account?.address.toString();
        if (!receiverAddress) throw new Error("No receiver address");
        const addressValue = receiverAddress.slice(1);

        const greaterThen = sinceDate !== null ? `gt: ${sinceDate / 1000}` : "";
        const lessThen = untilDate !== null ? `, lt: ${untilDate / 1000}` : "";

        const createdAtString = `{ ${greaterThen}${lessThen} }`;

        return await this.apollo.query({
            query: gql`
                    query {
                      messages(
                        filter: {
                          msg_type: { eq: 2 },
                          dst: { eq: "${addressValue}" },
                          src: { eq: "${this.contract?.address.toString()}" },
                          created_at: ${createdAtString}
                          created_lt: { ${
                              options?.nextPageAfterMessage?.created_lt
                                  ? `lt: "${options.nextPageAfterMessage.created_lt}"`
                                  : ""
                          } }
                        }
                        orderBy: [{path: "created_at", direction: DESC}]
                        limit: ${
                            options?.messagesLimit || this.MESSAGES_FETCH_LIMIT
                        }
                      ) {
                        body
                        id
                        src
                        created_at
                        created_lt
                        dst
                      }
                    }`,
            fetchPolicy: "no-cache",
        });
    }
}
