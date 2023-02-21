import { nanoid } from 'nanoid';

export namespace OtcApi {
	export type IMessage = any;

	export interface IAsset {
		id: string;
		token: string; // USDC
		blockchain: string; // EVM_NAMES[EVMNetwork.ETHEREUM] - like this

		totalWallets: number;
		totalAmount: number;
		totalValue: number;
	}

	export interface IAssetWallet {
		address: string;
		balance: number;
		value: number;
		blockchain: string; // EVM_NAMES[EVMNetwork.ETHEREUM] - like this
	}

	export interface IAssetsResponse {
		assets: IAsset[];
		totalCount: number;
		totalWallets: number;
		totalValue: number;
	}

	export interface IWalletsResponse {
		wallets: IAssetWallet[];
		totalCount: number;
		totalValue: number;
	}

	export type IChatMessage =
		| { type: 'message'; id: string; isIncoming: boolean; msg: IMessage }
		| { type: 'deal-proposal'; id: string; isIncoming: boolean; data: any }
		| { type: 'deal-closed'; id: string; isIncoming: boolean; data: any };

	export interface IThreadResponse {
		entries: IChatMessage[]; // desc sorted by timestamp
		totalCount: number;
	}

	export async function queryAssets(
		tokenQuery: string,
		chainQuery: string,
		sorting: null | { key: 'totalWallets' | 'totalAmount' | 'totalValue'; direction: 'asc' | 'desc' },
		offset: number,
		limit: number,
	): Promise<IAssetsResponse> {
		return {
			assets: [
				{
					id: nanoid(),
					blockchain: 'Ethereum',
					token: 'USDC',
					totalAmount: 29149,
					totalValue: 29149,
					totalWallets: 371,
				},
				{
					id: nanoid(),
					blockchain: 'Ethereum',
					token: 'USDT',
					totalAmount: 50123,
					totalValue: 50123,
					totalWallets: 567,
				},
				{
					id: nanoid(),
					blockchain: 'Bitcoin',
					token: 'BTC',
					totalAmount: 123123,
					totalValue: 123123,
					totalWallets: 123456,
				},
			],
			totalCount: 3,
			totalValue: 201120,
			totalWallets: 2101,
		};
	}

	export async function queryWalletsByToken(
		token: string,
		chainQuery: string,
		sorting: null | { key: 'balance' | 'value'; direction: 'asc' | 'desc' },
		offset: number,
		limit: number,
	): Promise<IWalletsResponse> {
		return {
			wallets: [
				{
					address: '0x52e316e323c35e5b222ba63311433f91d80545ee',
					balance: 123,
					value: 456,
					blockchain: 'Ethereum',
				},
				{
					address: '0x52e316e323c35e5b222ba63311433f91d80545ee',
					balance: 123,
					value: 456,
					blockchain: 'Ethereum',
				},
			],
			totalCount: 123,
			totalValue: 456,
		};
	}

	export async function loadOtcThread(
		myAddress: string,
		recipientAddress: string,
		offset: number,
		limit: number,
	): Promise<IThreadResponse> {
		return null as any;
	}
}
