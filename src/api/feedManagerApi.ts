import { REACT_APP__FEED_MANAGER } from '../env';
import { MainviewKeyPayload } from '../types';
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

	async function request<Res = void>(path: string, query?: Record<string, any>, data?: any): Promise<Res> {
		const response = await fetch(
			`${REACT_APP__FEED_MANAGER}${path}?${query ? createCleanSerachParams(query) : ''}`,
			{
				method: data ? 'POST' : 'GET',
				headers: {
					'Content-Type': 'application/json',
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

	export interface CheckInviteResponse {
		used: boolean;
		usedByThisAddress: boolean;
	}

	export async function checkInvite(invite: string, address: string) {
		return await request<CheckInviteResponse>(`/check-invite`, {
			invite,
			address,
		});
	}

	//

	export interface AuthAddressResponse {
		token: string;
	}

	export async function authAddress(payload: MainviewKeyPayload) {
		return await request<AuthAddressResponse>(`/auth-address`, undefined, {
			...payload,
		});
	}

	//

	export async function init(token: string, tvm?: string) {
		return await request<undefined | { inLine: boolean }>(`/init`, {
			token,
			tvm,
		});
	}

	export async function checkInit(token: string) {
		return await request<boolean>(`/check-init`, {
			token,
		});
	}

	export async function isAddressActive(address: string) {
		return await request<boolean>(`/is-address-active`, {
			address,
		});
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
		return await request<CoverageData[]>(`/v2/coverage`, {
			token,
		});
	}

	export type TagsResponse = {
		id: number;
		name: string;
	}[];

	export async function getTags() {
		return await request<TagsResponse>('/tags');
	}

	export async function subscribe(token: string, subscription: PushSubscription | null) {
		return await request('/save-subscription', undefined, { token, subscription });
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

	export async function getConfig(data: { token: string }) {
		return await request<GetConfigResponse>(`/get-config`, data);
	}

	export async function setConfig(data: {
		token: string;
		config: {
			mode: ConfigMode;
			includedSourceIds: string[];
			excludedSourceIds: string[];
		};
	}) {
		return await request(`/set-config`, {}, data);
	}
}
