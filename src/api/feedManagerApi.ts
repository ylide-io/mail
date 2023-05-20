import { REACT_APP__FEED_MANAGER } from '../env';
import { createCleanSerachParams } from '../utils/url';

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

	export enum ConfigMode {
		AUTO_ADD = 'auto-add',
		DONT_ADD = 'dont-add',
	}

	export interface ConfigEntity {
		address: string;
		mode: ConfigMode;
		includedProjectIds: string[];
		excludedProjectIds: string[];
		lastLoginTimestamp: number;
	}

	export interface UserProjectEntity {
		projectId: string;
		projectName: string;
		reasons: string[];
		reasonsRaw: string[][];
		reasonsDataRaw: any[];
	}

	export namespace FeedManagerResponse {
		export interface CheckInviteData {
			used: boolean;
			usedByThisAddress: boolean;
		}

		export interface GetConfigData {
			config: ConfigEntity;
			defaultProjects: UserProjectEntity[];
		}

		export interface AuthAddressData {
			token: string;
		}

		export type UserData = UserProjectEntity[];
	}

	export function getUrl() {
		return REACT_APP__FEED_MANAGER || 'http://localhost:8271' || 'https://fm-api.ylide.io'; //  ||
	}

	async function request<Resp>(path: string, query?: Record<string, any>, data?: any): Promise<Resp> {
		const response = await fetch(`${getUrl()}${path}?${query ? createCleanSerachParams(query) : ''}`, {
			method: data ? 'POST' : 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			body: data ? JSON.stringify(data) : undefined,
		});
		if (response.status < 200 || response.status >= 300) {
			let body: FeedManagerResponse<Resp>;
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
			const body: FeedManagerResponse<Resp> = await response.json();
			if (body.result === false) {
				throw new FeedManagerError(body.error);
			} else {
				return body.data;
			}
		}
	}

	export async function checkInvite(invite: string, address: string) {
		return await request<FeedManagerResponse.CheckInviteData>(`/check-invite`, {
			invite,
			address,
		});
	}

	export async function authAddress(address: string, signature: string, messageTimestamp: number, invite?: string) {
		return await request<FeedManagerResponse.AuthAddressData>(`/auth-address`, undefined, {
			address,
			signature,
			messageTimestamp,
			invite: invite || '',
		});
	}

	export async function getConfig(token: string) {
		return await request<FeedManagerResponse.GetConfigData>(`/get-config`, {
			token,
		});
	}

	export async function init(token: string) {
		return await request<void>(`/init`, {
			token,
		});
	}

	export async function isAddressActive(address: string) {
		return await request<boolean>(`/is-address-active`, {
			address,
		});
	}

	export async function setConfig(
		token: string,
		config: {
			mode: ConfigMode;
			includedProjectIds: string[];
			excludedProjectIds: string[];
		},
	) {
		return await request<void>(`/set-config`, {}, { token, config });
	}
}
