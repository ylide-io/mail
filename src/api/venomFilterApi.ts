import { ITVMMessage } from '@ylide/everscale';
import { IMessage, IMessageContent, IMessageCorruptedContent } from '@ylide/sdk';

import { REACT_APP__FEED_VENOM } from '../env';
import { IMessageDecodedContent } from '../indexedDB/IndexedDB';
import { invariant } from '../utils/assert';
import { decodeBroadcastContent } from '../utils/mail';
import { createCleanSerachParams } from '../utils/url';

export interface VenomFeedPost {
	id: string;
	createTimestamp: number;
	sender: string;
	meta: Exclude<ITVMMessage, 'key'> & { key: number[] };
	content: IMessageCorruptedContent | (Exclude<IMessageContent, 'content'> & { content: number[] }) | null;
	banned: boolean;
	isAdmin?: boolean;
}

export interface DecodedVenomFeedPost {
	original: VenomFeedPost;
	msg: IMessage;
	decoded: IMessageDecodedContent;
}

export function decodeVenomFeedPost(p: VenomFeedPost): DecodedVenomFeedPost {
	const msg: IMessage = {
		...p.meta,
		key: new Uint8Array(p.meta.key),
	};

	const decoded = decodeBroadcastContent(
		msg.msgId,
		msg,
		p.content
			? p.content.corrupted
				? p.content
				: {
						...p.content,
						content: new Uint8Array(p.content.content),
				  }
			: null,
	);

	// if (decoded.decodedTextData.type === MessageDecodedTextDataType.YMF) {
	// 	decoded.decodedTextData.value.root.children.unshift({
	// 		parent: decoded.decodedTextData.value.root,
	// 		type: 'tag',
	// 		tag: 'reply-to',
	// 		attributes: {
	// 			id: 'yA1TeDLKGWN7Vk82NvYG7G5cq8d/S+Ef7R/oy7l8wJPaoQ==',
	// 		},
	// 		singular: true,
	// 		children: [],
	// 	});
	// }

	return {
		original: p,
		msg,
		decoded: decoded,
	};
}

//

export namespace VenomFilterApi {
	export function getUrl() {
		return (
			REACT_APP__FEED_VENOM ||
			[
				'https://venom1.ylide.io',
				'https://venom2.ylide.io',
				'https://venom3.ylide.io',
				'https://venom4.ylide.io',
				'https://venom5.ylide.io',
			][Math.floor(Math.random() * 5)]
		);
	}

	const url = getUrl();

	async function request<Data = string>(
		path: string,
		opts?: { query?: Record<string, any>; params?: RequestInit },
	): Promise<Data> {
		const query = Object.assign({}, opts?.query);

		const response = await fetch(`${url}${path}?${query ? createCleanSerachParams(query) : ''}`, opts?.params);
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

	export async function approvePost(params: { ids: string[]; secret: string }) {
		return await request('/approve-posts', {
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

	export async function getPosts(params: { feedId: string; beforeTimestamp: number; adminMode?: boolean }) {
		return await request<VenomFeedPost[]>('/posts', {
			query: { feedId: params.feedId, beforeTimestamp: params.beforeTimestamp, adminMode: params.adminMode },
		});
	}

	export async function getPost(params: { id: string; adminMode?: boolean }) {
		return await request<VenomFeedPost | null>('/post', {
			query: { id: params.id, adminMode: params.adminMode },
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
