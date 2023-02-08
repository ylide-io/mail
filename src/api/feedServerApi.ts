import { createSearchParams } from 'react-router-dom';

import { FeedPost } from '../stores/Feed';

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

	export interface GetPostsResponse {
		result: boolean;
		data: { moreAvailable: boolean; newPosts: number; items: FeedPost[] } | null;
	}

	export async function getPosts(
		categories: string[],
		sourceId: string | null,
		lastPostId: string | null,
		firstPostId: string | null,
		length: number,
		needOld: boolean = true,
	): Promise<GetPostsResponse> {
		const endpoint = `${getUrl()}/${needOld ? 'post' : 'new-post'}`;

		const search: Record<string, any> = {
			categories: categories.join(','),
			sourceId: sourceId || '',
			lastPostId: lastPostId || 'null',
			firstPostId: firstPostId || 'null',
			length,
		};

		const response = await fetch(`${endpoint}?${createSearchParams(search).toString()}`);

		return await response.json();
	}
}
