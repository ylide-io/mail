import { REACT_APP__FEED_MANAGER } from '../env';
import { AuthorizationPayload } from '../types';
import { createCleanSerachParams } from '../utils/url';
import { FeedReason } from './feedServerApi';

export namespace FeedManagerApi {
	export enum ErrorCode {
		INVALID_REQUEST = 'INVALID_REQUEST',
		INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',
		INVALID_INVITE = 'INVALID_INVITE',
		INVALID_SIGNATURE = 'INVALID_SIGNATURE',
		INVALID_TOKEN = 'INVALID_TOKEN',
		INVALID_ADDRESS = 'INVALID_ADDRESS',
		INTERNAL_ERROR = 'INTERNAL_ERROR',
	}

	export class FeedManagerError extends Error {
		constructor(readonly code: ErrorCode) {
			super(code);
		}
	}

	export interface FeedManagerSuccessResponse<Data> {
		result: true;
		data: Data;
	}

	export interface FeedManagerErrorResponse {
		result: false;
		error: ErrorCode;
		data?: any;
	}

	export type FeedManagerResponse<Data> = FeedManagerSuccessResponse<Data> | FeedManagerErrorResponse;

	async function request<Res = void>({
		path,
		query,
		data,
		token,
	}: {
		path: string;
		query?: Record<string, any>;
		data?: any;
		token?: string;
	}): Promise<Res> {
		const response = await fetch(
			`${REACT_APP__FEED_MANAGER}${path}${query ? '?' + createCleanSerachParams(query) : ''}`,
			{
				method: data ? 'POST' : 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: data ? JSON.stringify(data) : undefined,
			},
		);

		if (response.status < 200 || response.status >= 300) {
			let body: FeedManagerResponse<Res>;
			try {
				body = await response.json();
			} catch (err) {
				throw new Error(response.statusText);
			}
			if (body && !body.result && typeof body.error === 'string') {
				throw new FeedManagerError(body.error);
			} else {
				throw new Error(response.statusText);
			}
		} else {
			const body: FeedManagerResponse<Res> = await response.json();
			if (!body.result) {
				throw new FeedManagerError(body.error);
			} else {
				return body.data;
			}
		}
	}

	//

	export interface AuthAddressResponse {
		token: string;
	}

	export async function authAddress(data: AuthorizationPayload, referrer?: string | null) {
		const query = referrer ? { referrer } : undefined;
		return await request<AuthAddressResponse>({ path: `/v3/new-auth-address`, data, query });
	}

	//

	export async function init(token: string, tvm?: string) {
		return await request<undefined | { inLine: boolean }>({ path: `/v3/init`, token, query: { tvm } });
	}

	export async function checkInit(token: string) {
		return await request<boolean>({ path: `/v3/check-init`, token });
	}

	export interface CoverageItem {
		tokenId: string;
		missing: boolean;
		projectName: string | null;
		name: string | null;
		symbol: string | null;
	}

	export type CoverageInfo = {
		items: CoverageItem[];
	} & Ratio &
		RatioUsd;

	export interface Ratio {
		ratio: number;
		coveredCount: number;
		total: number;
	}
	export interface RatioUsd {
		ratioUsd: number;
		usdTotal: number;
		usdCovered: number;
	}

	export type Coverage = {
		tokens: CoverageInfo;
		protocols: CoverageInfo;
		totalCoverage: string;
	};

	export interface CoverageData {
		tokenId: string;
		address: string;
		missing: boolean;
		projectName: string | null;
		tokenName: string | null;
		tokenSymbol: string | null;
		protocolName: string | null;
		protocolTokenSymbol: string | null;
		reasonsData: [
			| { type: 'balance'; balanceUsd: number }
			| { type: 'transaction' }
			| {
					type: 'protocol';
					data: {
						portfolio_item_list: [{ stats: { net_usd_value: number } }];
					};
			  }
			| {
					type: 'protocol';
					data: TVMAccountsDataResponse;
			  },
		];
	}

	export type TVMAccountsDataResponse = {
		address: string;
		pools: {
			poolAddress: string;
			poolType: string;
			totalUsdValue: string;
			supplyTokenList: {
				amount: string;
				decimals: number;
				rootAddress: string;
				symbol: string;
				usdValue: string;
			}[];
		}[];
		liquidity?: {
			totalUsdValue: string;
			supplyTokenList: {
				amount: string;
				decimals: number;
				rootAddress: string;
				symbol: string;
				usdValue: string;
			}[];
		};
	};

	export async function getCoverage(token: string) {
		return await request<CoverageData[]>({ path: `/v3/coverage`, token });
	}

	export type TagsResponse = {
		id: number;
		name: string;
	}[];

	export async function getTags() {
		return await request<TagsResponse>({ path: '/v3/tags' });
	}

	export async function subscribe(token: string, subscription: PushSubscription) {
		return await request({ path: '/v3/save-subscription', token, data: { subscription } });
	}

	//

	export interface UserProject {
		projectId: string;
		projectName: string;
		reasons: FeedReason[];
		reasonsRaw: string[][];
		reasonsDataRaw: any[];
	}

	export enum ConfigMode {
		AUTO_ADD = 'auto-add',
		DONT_ADD = 'dont-add',
	}

	export interface ConfigEntity {
		address: string;
		mode: ConfigMode;
		includedSourceIds: string[];
		excludedSourceIds: string[];
		lastLoginTimestamp: number;
	}

	export interface GetConfigResponse {
		config: ConfigEntity;
		defaultProjects: UserProject[];
	}

	export async function getConfig(params: { token: string }) {
		return await request<GetConfigResponse>({ path: '/v3/get-config', token: params.token });
	}

	export async function setConfig(params: {
		token: string;
		config: {
			mode: ConfigMode;
			includedSourceIds: string[];
			excludedSourceIds: string[];
		};
	}) {
		return await request({ path: `/v3/set-config`, data: params.config, token: params.token });
	}

	export interface ReservationPlan {
		name: string;
		type: 'basic' | 'pro';
		interval: 'month' | 'year';
		totalPrice: number;
		amount: number;
	}

	export enum MVTreasuryBlockchain {
		ETHEREUM = 'ethereum',
		BNBCHAIN = 'bnbchain',
		POLYGON = 'polygon',
		GNOSIS = 'gnosis',
	}

	export interface TreasuryReservation {
		id: string;
		treasury: string;
		plan: ReservationPlan;
		start: number;
		end: number;
		fulfilled: boolean;
	}

	export interface TreasuryTransaction {
		txHash: string;
		blockchain: MVTreasuryBlockchain;
		treasury: string;
		timestamp: number;
		from: string;
		token: string;
		amountRaw: string;
		amount: string;
		accountId: string | null;
	}

	export interface AccountPlan {
		plan: 'none' | 'trial' | 'basic' | 'pro';
		planEndsAt: number;

		activeReservations: TreasuryReservation[];
		lastPaidTx: TreasuryTransaction | null;
	}

	export async function getAccountPlan(params: { token: string }) {
		return await request<AccountPlan>({ path: '/v3/payments/plan', token: params.token });
	}

	export async function buyPlan(params: { token: string; planId: string; amount: number }) {
		return await request<TreasuryReservation>({
			path: '/v3/payments/buy',
			data: { planId: params.planId, amount: params.amount },
			token: params.token,
		});
	}

	export async function getTransactions(params: { token: string }) {
		return await request<TreasuryTransaction[]>({ path: '/v3/payments/transactions', token: params.token });
	}
}
