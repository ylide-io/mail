import { FeedPost, FeedSource } from '../stores/Feed';
import { createCleanSerachParams } from '../utils/url';

export namespace FeedServerApi {
	export const getUrl = () =>
		process.env.REACT_APP_FEED_SERVER ||
		[
			'https://fd1.ylide.io',
			'https://fd2.ylide.io',
			'https://fd3.ylide.io',
			'https://fd4.ylide.io',
			'https://fd5.ylide.io',
		][Math.floor(Math.random() * 5)];

	export interface GetPostsParams {
		categories: string[];
		needOld: boolean;
		length: number;
		sourceId?: string;
		sourceListId?: string;
		lastPostId?: string;
		firstPostId?: string;
	}

	export interface GetPostsResponse {
		result: boolean;
		data: { moreAvailable: boolean; newPosts: number; items: FeedPost[] } | null;
	}

	export async function getPosts(params: GetPostsParams): Promise<GetPostsResponse> {
		const endpoint = `${getUrl()}/${params.needOld ? 'post' : 'new-post'}`;

		const response = await fetch(`${endpoint}?${createCleanSerachParams(params)}`);

		return await response.json();
	}

	export interface GetSourcesResponse {
		sources: FeedSource[];
	}

	export async function getSources(): Promise<GetSourcesResponse> {
		const response = await fetch(`${getUrl()}/source`);

		return await response.json();
	}

	export interface CreateSourceListResponse {
		sourceListId: string;
	}

	export async function createSourceList(sourceIds: string[]): Promise<CreateSourceListResponse> {
		const response = await fetch(`${getUrl()}/source-list/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ sourceIds }),
		});

		return await response.json();
	}
}
