import { ITVMMessage } from '@ylide/everscale';
import { IMessageContent, IMessageCorruptedContent } from '@ylide/sdk';

import { REACT_APP__FEED_VENOM } from '../env';
import { invariant } from '../utils/assert';
import { createCleanSerachParams } from '../utils/url';

export interface IVenomFeedPost {
	id: string;
	createTimestamp: number;
	sender: string;
	meta: Exclude<ITVMMessage, 'key'> & { key: number[] };
	content: IMessageCorruptedContent | (Exclude<IMessageContent, 'content'> & { content: number[] }) | null;
	banned: boolean;
}

export namespace VenomFilterApi {
	async function request<Data = string>(
		path: string,
		opts?: { query?: Record<string, any>; params?: RequestInit },
	): Promise<Data> {
		const query = Object.assign({}, opts?.query);

		const response = await fetch(
			`${REACT_APP__FEED_VENOM || `https://venom.ylide.io`}${path}?${
				query ? createCleanSerachParams(query) : ''
			}`,
			opts?.params,
		);
		invariant(response.status >= 200 && response.status < 300, 'Request failed');

		const text = await response.text();
		try {
			return JSON.parse(text) as Data;
		} catch (e) {}

		return text as Data;
	}

	//

	export async function getPostsStatus(params: { ids: string[] }) {
		return await request<{ bannedPosts: string[] }>('/posts-status', { query: { id: params.ids } });
	}

	export async function banAddresses(params: { addresses: string[]; secret: string }) {
		return await request('/ban-addresses', {
			query: { secret: params.secret, address: params.addresses },
			params: { method: 'POST' },
		});
	}

	export async function unbanAddresses(params: { addresses: string[]; secret: string }) {
		return await request('/unban-addresses', {
			query: { secret: params.secret, address: params.addresses },
			params: { method: 'POST' },
		});
	}

	export async function banPost(params: { ids: string[]; secret: string }) {
		return await request('/ban-posts', {
			query: { secret: params.secret, id: params.ids },
			params: { method: 'POST' },
		});
	}

	export async function unbanPost(params: { ids: string[]; secret: string }) {
		return await request('/unban-posts', {
			query: { secret: params.secret, id: params.ids },
			params: {
				method: 'DELETE',
			},
		});
	}

	export async function getPosts(params: { beforeTimestamp: number; adminMode?: boolean }) {
		return await request<IVenomFeedPost[]>('/posts', {
			query: { beforeTimestamp: params.beforeTimestamp, adminMode: params.adminMode },
		});
	}

	export async function getTextIdea() {
		return await request<string>('/get-idea');
	}

	export async function getServiceStatus() {
		return await request<{ status: string }>('/service-status');
	}

	export async function startService(params: { secret: string }) {
		return await request('/start-service', {
			query: { secret: params.secret },
			params: { method: 'GET' },
		});
	}

	export async function stopService(params: { secret: string }) {
		return await request('/stop-service', {
			query: { secret: params.secret },
			params: { method: 'GET' },
		});
	}
}
