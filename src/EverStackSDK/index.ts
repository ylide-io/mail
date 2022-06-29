import {allWalletTypes, WalletType} from "./types/WalletType";
import {EverscaleMessagingLayer} from "./implementations/EverscaleMessagingLayer";
import {AbstractMessagingLayer} from "./abstracts/AbstractMessagingLayer";

export default class EverStackSDK {

    private static getWalletImplementationClass(
        walletType: WalletType,
    ): typeof EverscaleMessagingLayer
        // | typeof EthereumMessagingLayer
    {
        if (walletType === WalletType.EverScale) {
            return EverscaleMessagingLayer;
        } else if (walletType === WalletType.Ethereum) {
            throw new Error('Only EverScale supported for now');
        } else {
            throw new Error('Only EverScale supported for now');
        }
    }

    static async getAvailableWallets(): Promise<WalletType[]> {
        const result: WalletType[] = [];

        for (let walletType of allWalletTypes) {
            try {
                const cls = this.getWalletImplementationClass(walletType);
                if (await cls.isWalletAvailable()) {
                    result.push(walletType);
                }
            } catch (e) {
                console.log(e)
            }
        }

        return result;
    }

    static async instantiateWallet(walletType: WalletType, options?: {
        abi?: any,
        address?: string,
        dev?: boolean
    }): Promise<AbstractMessagingLayer> {
        const cls = this.getWalletImplementationClass(walletType);
        if (!(await cls.isWalletAvailable())) {
            throw new Error('Wallet is not available');
        }
        return new cls(options);
    }
}
