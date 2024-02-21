import { REACT_APP__FEED_SERVER } from '../env';
import { invariant } from '../utils/assert';
import { createCleanSerachParams } from '../utils/url';

export enum LinkType {
	TELEGRAM = 'telegram',
	TWITTER = 'twitter',
	MEDIUM = 'medium',
	MIRROR = 'mirror',
	DISCORD = 'discord',
}

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
	tags: number[];
	date: string;
	authorName: string;
	authorAvatar: string;
	authorNickname: string;
	sourceLink: string;
	embeds: FeedPostEmbed[];
	thread: FeedPost[];
	cryptoProjectId: number | null;
}

export interface FeedPostEmbed {
	type: 'link-preview' | 'image' | 'video';
	previewImageUrl: string;
	link: string;
	title: string;
	text: string;
}

export namespace FeedServerApi {
	export enum ErrorCode {
		NOT_AUTHORIZED = 'NOT_AUTHORIZED',
		INACTIVE_ACCOUNT = 'INACTIVE_ACCOUNT',
		FEED_NOT_AVAILABLE = 'FEED_NOT_AVAILABLE',
		FEED_IS_EMPTY = 'FEED_IS_EMPTY',

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

	async function request<Data>(path: string, params?: RequestInit & { token?: string }): Promise<Data> {
		if (params?.token) {
			params.headers = {
				...params.headers,
				Authorization: `Bearer ${params.token}`,
			};
			delete params.token;
		}
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

	export type FeedDescriptor =
		| { type: 'tags'; tags: number[] }
		| { type: 'source'; sourceId: number }
		| { type: 'feed'; feedId: string };

	export async function getPosts(params: {
		feedDescriptor: FeedDescriptor;
		needOld: boolean;
		length: number;
		token: string;
		lastPostId?: string;
		firstPostId?: string;
		checkNewPosts?: boolean;
		signal?: AbortSignal;
	}): Promise<GetPostsResponse> {
		return await request(
			`/v4/posts?${createCleanSerachParams({
				...params,
				feedDescriptor: undefined,
				signal: undefined,
				token: undefined,
				feed: JSON.stringify(params.feedDescriptor),
			})}`,
			{
				signal: params.signal,
				token: params.token,
			},
		);
	}

	export type GetPostResponse = { post: FeedPost };

	export async function getPost(id: string): Promise<GetPostResponse> {
		return await request(`/v4/posts/${id}`);
	}

	export interface RawFeedProject {
		id: number;
		name: string;
		logoUrl: string | null;
	}

	export interface RawFeedSource {
		id: string;
		name: string;
		origin?: string;
		avatar?: string;
		link: string;
		type: LinkType;
		projectId: number | null;
	}

	export type GetSourcesResponse = { projects: RawFeedProject[]; sources: RawFeedSource[] };

	export async function getSources({ token }: { token: string }): Promise<GetSourcesResponse> {
		return await request<GetSourcesResponse>('/v4/sources', { token });
	}
}
