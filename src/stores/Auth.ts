import { makeAutoObservable } from "mobx";
import { IGenericAccount } from "../EverStackSDK/types/IGenericAccount";
import EverStackSDK from "../EverStackSDK";
import { WalletType } from "../EverStackSDK/types/WalletType";
import { AbstractMessagingLayer } from "../EverStackSDK/abstracts/AbstractMessagingLayer";
import mailer from "./Mailer";

class Auth {
    wallet: AbstractMessagingLayer | null = null;

    account: IGenericAccount | null = null;
    wallets: WalletType[] | null = null;

    loading: boolean = true;
    authenticating: boolean = false;

    isDev: boolean = false;

    constructor() {
        makeAutoObservable(this);
    }

    setLoading = (flag: boolean) => {
        this.loading = flag;
    };

    async setAvailableWallets() {
        this.wallets = await EverStackSDK.getAvailableWallets();
    }

    async setWallet(walletType: WalletType | null) {
        try {
            if (walletType === null) {
                this.wallet = null;
                this.removeStorageWallet();
                return;
            }

            this.wallet = await EverStackSDK.instantiateWallet(walletType, {
                dev: this.isDev,
            });

            localStorage.setItem("walletType", WalletType[walletType]);
        } catch (e) {
            localStorage.removeItem("walletType");
        }
    }

    async getAvailableWallets(): Promise<WalletType[]> {
        return await EverStackSDK.getAvailableWallets();
    }

    async checkAuth() {
        this.setLoading(true);
        if (!this.wallet) {
            const wallet = localStorage.getItem("walletType");
            if (wallet) {
                const parsedWallet = Auth.parseWalletType(wallet);
                if (parsedWallet !== null) {
                    await this.setWallet(parsedWallet);
                }
            }
        }
        const account = await this.wallet?.getAuth();
        if (account) {
            this.account = account;
        }
        this.setLoading(false);
    }

    async authenticate() {
        try {
            const account = await this.wallet?.requestAuthentication();
            if (account) {
                this.account = account;
            }
        } catch (e) {
            throw e;
        }
    }

    async disconnectAccount() {
        this.removeStorageWallet();
        mailer.resetAllMessages();
        await this.wallet?.disconnectAccount();
        this.account = null;
    }

    removeStorageWallet() {
        localStorage.removeItem("walletType");
    }

    private static parseWalletType(typeString: string): WalletType | null {
        try {
            if (!Object.keys(WalletType).includes(typeString)) return null;
            // @ts-ignore
            const type = WalletType[typeString];
            if (type === undefined) {
                return null;
            }

            return type;
        } catch (e) {
            return null;
        }
    }
}

const auth = new Auth();

export default auth;
