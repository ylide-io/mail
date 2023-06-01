import { nanoid } from 'nanoid';

import { REACT_APP__FEED_SERVER } from '../env';
import { randomArrayElem } from '../utils/array';
import { invariant } from '../utils/assert';
import { createCleanSerachParams } from '../utils/url';

export interface FeedSource {
	id: string;
	category: FeedCategory;
	name: string;
	origin?: string;
	avatar?: string;
	link: string;
	type: LinkType;
	cryptoProjectId?: string;
	cryptoProjectName?: string;
}

export enum FeedCategory {
	MARKETS = 'Markets',
	ANALYTICS = 'Analytics',
	PROJECTS = 'Projects',
	POLICY = 'Policy',
	SECURITY = 'Security',
	TECHNOLOGY = 'Technology',
	CULTURE = 'Culture',
	EDUCATION = 'Education',
}

export enum FeedSourceUserRelation {
	NONE = 'NONE',
	HOLDING_TOKEN = 'HOLDING_TOKEN',
	HELD_TOKEN = 'HELD_TOKEN',
	USING_PROJECT = 'USING_PROJECT',
	USED_PROJECT = 'USED_PROJECT',
}

//

export interface FeedPost {
	id: string;
	title: string;
	subtitle: string;
	content: string;
	picrel: string;
	sourceId: string;
	sourceName: string;
	sourceNickname: string;
	serverName: string;
	channelName: string;
	sourceType: LinkType;
	categories: string[];
	date: string;
	authorName: string;
	authorAvatar: string;
	authorNickname: string;
	sourceLink: string;
	embeds: FeedPostEmbed[];
	thread: FeedPost[];
	tokens: string[];
	userRelation: FeedSourceUserRelation;
	cryptoProjectId: string | null;
	cryptoProjectName: string | null;
	cryptoProjectReasons: string[];
}

export enum LinkType {
	TELEGRAM = 'telegram',
	TWITTER = 'twitter',
	MEDIUM = 'medium',
	MIRROR = 'mirror',
	DISCORD = 'discord',
}

export interface FeedPostEmbed {
	type: 'link-preview' | 'image' | 'video';
	previewImageUrl: string;
	link: string;
	title: string;
	text: string;
}

//

export namespace FeedServerApi {
	export enum ErrorCode {
		NO_POSTS_FOR_ADDRESS = 'NO_POSTS_FOR_ADDRESS',
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

	export type GetPostsResponse = { moreAvailable: boolean; newPosts: number; items: FeedPost[] };

	export async function getPosts(params: {
		needOld: boolean;
		length: number;
		lastPostId?: string;
		firstPostId?: string;
		categories?: FeedCategory[];
		sourceId?: string;
		addressTokens?: string[];
	}): Promise<GetPostsResponse> {
		return await request(`/posts?${createCleanSerachParams(params)}`);
	}

	export type GetPostResponse = { post: FeedPost };

	export async function getPost(id: string): Promise<GetPostResponse> {
		return await request(`/posts/${id}`);
	}

	//

	export type GetSourcesResponse = { sources: FeedSource[] };

	export async function getSources(): Promise<GetSourcesResponse> {
		const response = await request<GetSourcesResponse>('/sources');

		// FIXME Temp
		response.sources.forEach(s => {
			s.cryptoProjectId = randomArrayElem([nanoid(), nanoid(), nanoid(), nanoid()]);
			s.cryptoProjectName = randomArrayElem(['Ethereum', 'XDAI', 'USDT', 'BTC']);
		});

		return response;
	}
}
