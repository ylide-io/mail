import { makeAutoObservable } from "mobx";
import Ylide, { AbstractMessagingLayer, IGenericAccount } from "@ylide/sdk";
import mailer from "./Mailer";

class Auth {
    wallet: AbstractMessagingLayer | null = null;

    account: IGenericAccount | null = null;
    wallets: { blockchain: string; wallet: string }[] = [];

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
        this.wallets = await this.getAvailableWallets();
    }

    async setWallet(walletType: string | null) {
        try {
            if (walletType === null) {
                this.wallet = null;
                this.removeStorageWallet();
                return;
            }
            //@ts-ignore
            this.wallet = window.wallet = await Ylide.instantiateWallet(
                Ylide.providers[walletType],
                {
                    dev: this.isDev,
                }
            );

            localStorage.setItem("walletType", walletType);
        } catch (e) {
            localStorage.removeItem("walletType");
        }
    }

    async getAvailableWallets(): Promise<
        { blockchain: string; wallet: string }[]
    > {
        const wallets = await Ylide.getAvailableWallets();
        console.log("wallets: ", wallets);
        return wallets.map((cls) => ({
            blockchain: cls.blockchainType(),
            wallet: cls.walletType(),
        }));
    }

    async checkAuth() {
        this.setLoading(true);
        if (!this.wallet) {
            const wallet = localStorage.getItem("walletType");
            if (wallet) {
                const walletCls = Ylide.providers[wallet];
                if (walletCls) {
                    await this.setWallet(wallet);
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
}

const auth = new Auth();

export default auth;
