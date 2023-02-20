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
		return null as any;
	}

	export async function queryWalletsByToken(
		token: string,
		chainQuery: string,
		sorting: null | { key: 'balance' | 'value'; direction: 'asc' | 'desc' },
		offset: number,
		limit: number,
	): Promise<IWalletsResponse> {
		return null as any;
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
