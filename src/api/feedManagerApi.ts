import { REACT_APP__FEED_MANAGER } from '../env';
import { createCleanSerachParams } from '../utils/url';

export namespace FeedManagerApi {
	export enum ErrorCode {
		REQUIRED_PARAMETERS = 'REQUIRED_PARAMETERS',
		SOURCE_LIST_NOT_FOUND = 'SOURCE_LIST_NOT_FOUND',
		NO_POSTS_FOR_ADDRESS = 'NO_POSTS_FOR_ADDRESS',
	}

	export class FeedManagerError extends Error {
		constructor(readonly code: ErrorCode) {
			super(code);
		}
	}

	export function getUrl() {
		return REACT_APP__FEED_MANAGER || 'https://fm-api.ylide.io'; //  || 'http://localhost:8271'
	}

	async function request<Data>(path: string, query?: Record<string, any>, data?: any): Promise<Data> {
		const response = await fetch(`${getUrl()}${path}?${query ? createCleanSerachParams(query) : ''}`, {
			method: data ? 'POST' : 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			body: data ? JSON.stringify(data) : undefined,
		});
		if (response.status < 200 || response.status >= 300) {
			throw new Error(response.statusText);
		}

		return await response.json();
	}

	export async function checkInvite(invite: string): Promise<{ success: boolean; used: boolean }> {
		return await request(`/check-invite`, {
			invite,
		});
	}

	export async function authAddress(
		address: string,
		signature: string,
		messageTimestamp: number,
		invite?: string,
	): Promise<{ success: boolean; token: string }> {
		return await request(`/auth-address`, undefined, {
			address,
			signature,
			messageTimestamp,
			invite: invite || '',
		});
	}

	export enum ConfigMode {
		AUTO_ADD = 'auto-add',
		DONT_ADD = 'dont-add',
	}

	export async function getConfig(token: string): Promise<{
		success: true;
		config: {
			address: string;
			mode: ConfigMode;
			includedProjectIds: string[];
			excludedProjectIds: string[];
			lastLoginTimestamp: number;
		};
		defaultProjects: {
			projectId: string;
			reasons: string[];
			reasonsData: any[];
		}[];
	}> {
		return await request(`/get-config`, {
			token,
		});
	}

	export async function init(token: string): Promise<{ success: true }> {
		return await request(`/init`, {
			token,
		});
	}

	/*
	app.post('/set-config', async (req, res) => {
		try {
			const { token: tokenRaw, config: configRaw } = req.query;
			if (typeof tokenRaw !== 'string') {
				throw new Error('Invalid token');
			}
			const token = String(tokenRaw);
			const { authBundle, authConfig } = await authByKey(token);

			const { mode, includedProjectIds, excludedProjectIds } = configRaw as any;
			*/
	export async function setConfig(
		token: string,
		config: {
			mode: ConfigMode;
			includedProjectIds: string[];
			excludedProjectIds: string[];
		},
	): Promise<{ success: true }> {
		return await request(`/set-config`, {}, { token, config });
	}
}
