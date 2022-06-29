import {Address, WalletContractType} from "everscale-inpage-provider";

export interface IGenericAccount {
    address: Address,
    publicKey: string,
    contractType: WalletContractType
}
