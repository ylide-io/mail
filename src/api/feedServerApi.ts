import { REACT_APP__FEED_SERVER } from '../env';
import { FeedPost, FeedSource } from '../stores/Feed';
import { invariant } from '../utils/invariant';
import { createCleanSerachParams } from '../utils/url';

export namespace FeedServerApi {
	export enum ErrorCode {
		SOURCE_LIST_NOT_FOUND = 'SOURCE_LIST_NOT_FOUND',
	}

	export class FeedServerError extends Error {
		constructor(readonly code: ErrorCode) {
			super(code);
		}
	}

	export function getUrl() {
		return (
			REACT_APP__FEED_SERVER ||
			[
				'https://fd1.ylide.io',
				'https://fd2.ylide.io',
				'https://fd3.ylide.io',
				'https://fd4.ylide.io',
				'https://fd5.ylide.io',
			][Math.floor(Math.random() * 5)]
		);
	}

	export interface Response<Data> {
		error?: ErrorCode;
		data?: Data;
	}

	async function request<Data>(path: string, params?: RequestInit): Promise<Data> {
		const response = await fetch(`${getUrl()}${path}`, params);
		if (response.status < 200 || response.status >= 300) {
			throw new Error(response.statusText);
		}

		const json = (await response.json()) as Response<Data>;
		if (json.error) {
			throw new FeedServerError(json.error);
		}

		invariant(json.data);
		return json.data;
	}

	//

	export interface GetPostsParams {
		needOld: boolean;
		length: number;
		categories?: string[];
		sourceId?: string;
		sourceListId?: string;
		lastPostId?: string;
		firstPostId?: string;
	}

	export type GetPostsResponse = { moreAvailable: boolean; newPosts: number; items: FeedPost[] };

	export async function getPosts(params: GetPostsParams): Promise<GetPostsResponse> {
		return await request(`/posts?${createCleanSerachParams(params)}`);
	}

	//

	export type GetPostResponse = { post: FeedPost };

	export async function getPost(id: string): Promise<GetPostResponse> {
		return await request(`/posts/${id}`);
	}

	//

	export type GetSourcesResponse = { sources: FeedSource[] };

	export async function getSources(): Promise<GetSourcesResponse> {
		return await request('/sources');
	}

	//

	export type CreateSourceListResponse = { sourceListId: string };

	export async function createSourceList(sourceIds: string[]): Promise<CreateSourceListResponse> {
		return await request('/source-lists/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ sourceIds }),
		});
	}
}
