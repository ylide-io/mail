import { IMessage } from '@ylide/sdk';
import { nanoid } from 'nanoid';
import domain from '../stores/Domain';

export namespace OtcApi {
	export interface IAsset {
		id: string;
		token: string; // USDC
		blockchain: string; // EVM_NAMES[EVMNetwork.ETHEREUM] - like this

		totalWallets: number;
		totalAmount: number;
		totalValue: number;
	}

	export interface IAssetsResponse {
		assets: IAsset[];
		totalCount: number;
		totalWallets: number;
		totalValue: number;
	}

	export async function queryAssets(params: {
		searchTerm: string;
		sorting?: { key: 'totalWallets' | 'totalAmount' | 'totalValue'; direction: 'asc' | 'desc' };
		offset?: number;
		limit?: number;
	}): Promise<IAssetsResponse> {
		return domain.otc.queryAssets({
			query: params.searchTerm,
			sorting: params.sorting || null,
			offset: params.offset || 0,
			limit: params.limit || null,
		});
	}

	//

	export interface IAssetWallet {
		address: string;
		balance: number;
		value: number;
		blockchain: string; // EVM_NAMES[EVMNetwork.ETHEREUM] - like this
	}

	export interface IWalletsResponse {
		wallets: IAssetWallet[];
		totalCount: number;
		totalValue: number;
	}

	export async function queryWalletsByToken(params: {
		token: string;
		query: string;
		chain: string;
		sorting?: { key: 'balance' | 'value'; direction: 'asc' | 'desc' };
		offset?: number;
		limit?: number;
	}): Promise<IWalletsResponse> {
		return domain.otc.queryWalletsByToken({
			token: params.token,
			query: params.query,
			chain: params.chain,
			sorting: params.sorting || null,
			offset: params.offset || 0,
			limit: params.limit || null,
		});
	}

	export type IChatMessage =
		| { type: 'message'; id: string; isIncoming: boolean; msg: IMessage }
		| { type: 'deal-proposal'; id: string; isIncoming: boolean; data: any }
		| { type: 'deal-closed'; id: string; isIncoming: boolean; data: any };

	export interface IThreadResponse {
		entries: IChatMessage[]; // desc sorted by timestamp
		totalCount: number;
	}

	export async function loadOtcThread(params: {
		myAddress: string;
		recipientAddress: string;
		offset?: number;
		limit?: number;
	}): Promise<IThreadResponse> {
		return domain.otc.loadOtcThread({
			myAddress: params.myAddress,
			recipientAddress: params.recipientAddress,
			offset: params.offset || 0,
			limit: params.limit || 100,
		});
	}

	export interface IThread {
		address: string;
		lastMessageDate: number;
	}

	export interface IThreadsResponse {
		entries: IThread[];
		totalCount: number;
	}

	export async function queryThreads(): Promise<IThreadsResponse> {
		return domain.otc.loadOtcChats({
			myAddress: domain.accounts.activeAccounts[0].account.address,
		});
	}
}
