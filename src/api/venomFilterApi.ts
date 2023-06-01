import { invariant } from '../utils/assert';
import { createCleanSerachParams } from '../utils/url';

export namespace VenomFilterApi {
	async function request<Data>(path: string, query?: Record<string, any>, params?: RequestInit): Promise<Data> {
		const response = await fetch(
			`https://vfl.ylide.io${path}?${query ? createCleanSerachParams(query) : ''}`,
			params,
		);
		invariant(response.status >= 200 && response.status < 300, 'Request failed');

		const json = (await response.json()) as Data;
		invariant(json);

		return json;
	}

	//

	export async function getPostsStatus(params: { ids: string[] }) {
		return await request<{ bannedPosts: string[] }>('/posts-status', { id: params.ids });
	}

	export async function banPost(params: { id: string }) {
		return await request(
			'/ban-post',
			{ 'id': params.id, 'secret-string': 'yollo' },
			{
				method: 'POST',
			},
		);
	}

	export async function unbanPost(params: { id: string }) {
		return await request(
			'/unban-post',
			{ 'id': params.id, 'secret-string': 'yollo' },
			{
				method: 'POST',
			},
		);
	}
}
