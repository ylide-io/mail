import { ITVMMessage } from '@ylide/everscale';
import { IMessageContent, IMessageCorruptedContent } from '@ylide/sdk';

import { REACT_APP__FEED_VENOM } from '../env';
import { invariant } from '../utils/assert';
import { createCleanSerachParams } from '../utils/url';

const SECRET_QUERY = { secret: 'yollo' };

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

	export async function banPost(params: { ids: string[] }) {
		return await request('/ban-posts', { query: { ...SECRET_QUERY, id: params.ids }, params: { method: 'POST' } });
	}

	export async function unbanPost(params: { ids: string[] }) {
		return await request('/unban-posts', {
			query: { ...SECRET_QUERY, id: params.ids },
			params: {
				method: 'DELETE',
			},
		});
	}

	export async function getPosts(params: { beforeTimestamp: number; withBanned?: boolean }) {
		return await request<IVenomFeedPost[]>('/posts', {
			query: { beforeTimestamp: params.beforeTimestamp, withBanned: params.withBanned },
		});
	}
}
