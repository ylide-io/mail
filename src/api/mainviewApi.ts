import { REACT_APP__FEED_MANAGER } from '../env';
import { PortfolioSource, PortfolioSourceToAffectedProjectsMap } from '../shared/PortfolioScope';
import { IDomainAccount } from '../stores/models/DomainAccount';
import { createCleanSerachParams } from '../utils/url';

export namespace MainviewApi {
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

	export interface SignatureAuthorizationPayload {
		address: string;
		signature: string;
		timestamp: number;
	}

	export interface AuthAddressResponse extends IDomainAccount {
		initing: boolean;
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

	export enum ConfigMode {
		AUTO_ADD = 'auto-add',
		DONT_ADD = 'dont-add',
	}

	export interface MVFeedEntity {
		id: string;
		name: string;
		emoji: string;
		description: string;
		ownerAccountId: string;
		mode: ConfigMode;
		sources: PortfolioSource[];
		includedSourceIds: string[];
		excludedSourceIds: string[];
		settings: {
			tresholdType: 'percent' | 'value';
			tresholdValue: number;
		};
	}

	export interface FeedDataResponse {
		feed: MVFeedEntity;
		coverage: CoverageData[];
		owner: { id: string; name: string };
		accesses: { type: 'email' | 'address'; value: string; role: MVFeedAccessRole }[];
		portfolioSourceToAffectedProjects: PortfolioSourceToAffectedProjectsMap;
	}

	export enum MVFeedAccessRole {
		READ = 'read',
		EDIT_SOURCES = 'edit-sources',
		EDIT_USERS = 'edit-users',
	}

	export interface FeedsResponse {
		feeds: {
			accessLevel: MVFeedAccessRole;
			data: FeedDataResponse;
		}[];
	}

	export type TagsResponse = {
		id: number;
		name: string;
	}[];

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

	// --------------------------------------------

	export const auth = {
		session: async (token?: string | undefined | null) => {
			return await request<
				{ type: 'new'; token: string } | { type: 'existing'; account: null | AuthAddressResponse }
			>({
				path: `/v4/auth/session`,
				token: token || undefined,
			});
		},

		authBySignature: async (token: string, data: SignatureAuthorizationPayload, referrer?: string | null) => {
			const query = referrer ? { referrer } : undefined;
			return await request<AuthAddressResponse>({ path: `/v4/auth/signature`, token, data, query });
		},

		authByLink: async (token: string, slug: string) => {
			return await request<AuthAddressResponse>({ path: `/v4/auth/link`, token, data: { slug } });
		},

		logout: async (token: string) => {
			return await request<void>({ path: `/v4/auth/logout`, token, data: {} });
		},
	};

	//

	export const general = {
		reinit: async (token: string) => {
			return await request<void>({ path: `/v4/reinit`, token });
		},

		checkInited: async (token: string) => {
			return await request<{ initing: boolean; inited: boolean }>({ path: `/v4/check-inited`, token });
		},

		getTags: async () => {
			return await request<TagsResponse>({ path: '/v4/tags' });
		},

		subscribeToBrowserPushes: async (token: string, subscription: PushSubscription) => {
			return await request({ path: '/v4/push/browser', token, data: { subscription } });
		},
	};

	//

	export const feeds = {
		getFeeds: async ({ token }: { token: string }) => {
			return await request<FeedsResponse>({ path: `/v4/feeds`, token: token });
		},

		getFeedData: async ({ token, feedId = 'default' }: { token: string; feedId: string }) => {
			return await request<FeedDataResponse>({ path: `/v4/feed/${feedId}`, token: token });
		},

		checkAddressAvailability: async ({ token, address }: { token: string; address: string }) => {
			return await request<{
				available: boolean;
				trackingWallets: string[];
				isTracked: boolean;
				quota: number;
			}>({ path: `/v4/check-address`, token, query: { address } });
		},

		getPortfolioSourcesData: async ({
			token,
			sources,
			reason,
		}: {
			token: string;
			sources: PortfolioSource[];
			reason: string;
		}) => {
			return await request<{
				portfolioSourceToAffectedProjects: PortfolioSourceToAffectedProjectsMap;
				portfolioSourceToCoverageData: Record<string, CoverageData[]>;
			}>({
				path: `/v4/portfolio-sources?sources=${encodeURIComponent(
					JSON.stringify(sources),
				)}&reason=${encodeURIComponent(reason)}`,
				token,
			});
		},

		getWalletsQuota: async ({ token }: { token: string }) => {
			return await request<{ quota: number; uniqueWallets: string[] }>({
				path: `/v4/quota`,
				token,
			});
		},

		saveFeed: async (params: {
			token: string;
			feedId: string;
			config: {
				mode: ConfigMode;
				includedSourceIds: string[];
				excludedSourceIds: string[];
				sources: PortfolioSource[];
				settings: {
					tresholdType: 'percent' | 'value';
					tresholdValue: number;
				};
			};
			updateType: string;
		}) => {
			return await request({
				path: `/v4/feed/${params.feedId}?updateType=${encodeURIComponent(params.updateType)}`,
				data: params.config,
				token: params.token,
			});
		},
	};

	//

	export const payments = {
		getAccountPlan: async (params: { token: string; reason: string }) => {
			return await request<AccountPlan>({
				path: `/v4/payments/plan?reason=${encodeURIComponent(params.reason)}`,
				token: params.token,
			});
		},

		buyPlan: async (params: { token: string; planId: string; amount: number }) => {
			return await request<TreasuryReservation>({
				path: '/v3/payments/buy',
				data: { planId: params.planId, amount: params.amount },
				token: params.token,
			});
		},

		getTransactions: async (params: { token: string }) => {
			return await request<TreasuryTransaction[]>({ path: '/v4/payments/transactions', token: params.token });
		},
	};
}
