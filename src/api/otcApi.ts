import { nanoid } from 'nanoid';

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
		tokenQuery: string;
		chainQuery: string;
		sorting?: { key: 'totalWallets' | 'totalAmount' | 'totalValue'; direction: 'asc' | 'desc' };
		offset?: number;
		limit?: number;
	}): Promise<IAssetsResponse> {
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
		chainQuery: string;
		sorting?: { key: 'balance' | 'value'; direction: 'asc' | 'desc' };
		offset?: number;
		limit?: number;
	}): Promise<IWalletsResponse> {
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

	//

	export type IMessage = any;

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
		const entries = [
			{
				type: 'message',
				id: nanoid(),
				isIncoming: false,
				msg: 'Hey there! 🙌\nWhould you like to trade?\n\nCheers!',
			},
			{
				type: 'message',
				id: nanoid(),
				isIncoming: true,
				msg: 'Hi man!\nYeah, sure.',
			},
			{
				type: 'message',
				id: nanoid(),
				isIncoming: false,
				msg: 'Nice! 👍',
			},
			{
				type: 'message',
				id: nanoid(),
				isIncoming: false,
				msg: "Let's talk about the price...",
			},
			{
				type: 'message',
				id: nanoid(),
				isIncoming: false,
				msg: 'How much you want?',
			},
			{
				type: 'message',
				id: nanoid(),
				isIncoming: true,
				msg: 'Hm... Let me think...',
			},
			{
				type: 'message',
				id: nanoid(),
				isIncoming: true,
				msg: 'Maecenas elit ante, dictum at commodo ac, aliquam non felis. Integer et erat diam. Quisque faucibus est mattis, vehicula eros ut, congue mi. Vivamus ante lectus, vestibulum et venenatis nec, porta ut elit. Cras aliquam erat vitae laoreet mattis. Cras posuere pharetra eros eget elementum. Aliquam gravida, metus vitae venenatis blandit, augue mauris suscipit justo, quis ullamcorper purus tortor et arcu.',
			},
			{
				type: 'message',
				id: nanoid(),
				isIncoming: false,
				msg: 'Wtf?',
			},
		] as IMessage[];

		return {
			entries,
			totalCount: entries.length,
		};
	}
}
