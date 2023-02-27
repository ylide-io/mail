import { IMessage } from '@ylide/sdk';

import { Domain } from './Domain';

export interface IOTCAsset {
	id: string;
	token: string; // USDC
	blockchain: string; // EVM_NAMES[EVMNetwork.ETHEREUM] - like this

	totalWallets: number;
	totalAmount: number;
	totalValue: number;
}

export interface IOTCAssetWallet {
	address: string;
	balance: number;
	value: number;
	blockchain: string; // EVM_NAMES[EVMNetwork.ETHEREUM] - like this
}

export interface IOTCAssetsResponse {
	assets: IOTCAsset[];
	totalCount: number;
	totalWallets: number;
	totalValue: number;
}

export interface IOTCWalletsResponse {
	wallets: IOTCAssetWallet[];
	totalCount: number;
	totalValue: number;
}

export type IChatMessage =
	| { type: 'message'; id: string; isIncoming: boolean; msg: IMessage }
	| { type: 'deal-proposal'; id: string; isIncoming: boolean; data: any }
	| { type: 'deal-closed'; id: string; isIncoming: boolean; data: any };

export interface IOTCThreadResponse {
	entries: IChatMessage[]; // desc sorted by timestamp
	totalCount: number;
}

export class OTCStore {
	constructor(private readonly domain: Domain) {}

	get indexer() {
		return this.domain.ylide.core.indexer;
	}

	async loadOtcThread({
		myAddress,
		recipientAddress,
		offset = 0,
		limit = 100,
	}: {
		myAddress: string;
		recipientAddress: string;
		offset?: number;
		limit?: number;
	}): Promise<IOTCThreadResponse> {
		const data = await this.indexer.request('/otc-thread', {
			myAddress,
			recipientAddress,
			offset,
			limit,
		});
		return {
			totalCount: data.totalCount,
			entries: data.entries.map((m: any) => ({
				type: m.type,
				id: m.id,
				isIncoming: m.isIncoming,
				msg: {
					...m.msg,
					key: new Uint8Array(m.msg.key),
				},
			})),
		};
	}

	async queryAssets({
		query,
		sorting,
		offset,
		limit,
	}: {
		query: string;
		sorting: null | { key: 'totalWallets' | 'totalAmount' | 'totalValue'; direction: 'asc' | 'desc' };
		offset: number;
		limit: number;
	}): Promise<IOTCAssetsResponse> {
		const data = await this.indexer.request('/otc-assets', {
			query,
			sorting,
			offset,
			limit,
		});
		return {
			totalCount: data.totalCount,
			totalWallets: data.totalWallets,
			totalValue: data.totalValue,
			assets: data.assets,
		};
	}

	async queryWalletsByToken({
		token,
		query,
		sorting,
		offset,
		limit,
	}: {
		token: string;
		query: string;
		sorting: null | { key: 'balance' | 'value'; direction: 'asc' | 'desc' };
		offset: number;
		limit: number;
	}): Promise<IOTCWalletsResponse> {
		const data = await this.indexer.request('/otc-wallets', {
			token,
			query,
			sorting,
			offset,
			limit,
		});
		return {
			totalCount: data.totalCount,
			totalValue: data.totalValue,
			wallets: data.wallets,
		};
	}
}
