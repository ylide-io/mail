import { invariant } from '../utils/assert';
import { createCleanSerachParams } from '../utils/url';

const SECRET_QUERY = { secret: 'yollo' };

export namespace VenomFilterApi {
	async function request<Data = string>(
		path: string,
		opts?: { query?: Record<string, any>; params?: RequestInit },
	): Promise<Data> {
		const query = Object.assign({}, opts?.query);

		const response = await fetch(
			`https://vfl.ylide.io${path}?${query ? createCleanSerachParams(query) : ''}`,
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
}
