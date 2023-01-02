import { makeObservable, observable } from 'mobx';

import { analytics } from './Analytics';

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
}

class Feed {
	@observable posts: FeedPost[] = [];
	@observable loaded = false;
	@observable loading = false;

	@observable selectedCategory: string = 'main';
	@observable mainCategories: string[] = JSON.parse(
		localStorage.getItem('t_main_categories') ||
			JSON.stringify([
				'Markets',
				'Analytics',
				'Projects',
				'Policy',
				'Security',
				'Technology',
				'Culture',
				'Education',
			]),
	);

	@observable sourceId: string | null = null;

	@observable newPosts: number = 0;
	@observable moreAvailable = false;
	@observable errorLoading = false;

	getCategories(id: string) {
		if (id === 'main') {
			return this.mainCategories;
		} else if (id === 'all') {
			return ['Markets', 'Analytics', 'Projects', 'Policy', 'Security', 'Technology', 'Culture', 'Education'];
		} else {
			return [id];
		}
	}

	async genericLoad(
		categories: string[],
		sourceId: string | null,
		lastPostId: string | null,
		firstPostId: string | null,
		length: number,
		needOld: boolean = true,
	): Promise<{ result: boolean; data: null | { moreAvailable: boolean; newPosts: number; items: FeedPost[] } }> {
		this.loading = true;
		try {
			console.log('fetch start');
			const feedEndpoint =
				false && document.location.hostname === 'localhost'
					? 'http://localhost:8294'
					: [
							'https://fd1.ylide.io',
							'https://fd2.ylide.io',
							'https://fd3.ylide.io',
							'https://fd4.ylide.io',
							'https://fd5.ylide.io',
					  ][Math.floor(Math.random() * 5)];
			const response = await fetch(
				`${feedEndpoint}/${needOld ? 'post' : 'new-post'}?categories=${encodeURIComponent(
					categories.join(','),
				)}&sourceId=${sourceId || ''}&lastPostId=${
					lastPostId ? encodeURIComponent(lastPostId) : 'null'
				}&firstPostId=${firstPostId ? encodeURIComponent(firstPostId) : 'null'}&length=${encodeURIComponent(
					String(length),
				)}`,
				{
					method: 'GET',
				},
			);
			console.log('fetch end');
			return await response.json();
		} catch {
			this.errorLoading = true;
			return { result: false, data: null };
		} finally {
			this.loading = false;
		}
	}

	async loadCategory(id: string, sourceId: string | null) {
		analytics.feedPageLoaded(id, 1);
		this.selectedCategory = id;
		this.sourceId = sourceId;
		this.loaded = false;
		const result = await this.genericLoad(
			this.getCategories(this.selectedCategory),
			this.sourceId,
			null, // '1599259863087190016',
			null, // '1599259863087190016',
			10,
			true,
		);
		if (result.result && result.data) {
			this.loaded = true;
			this.posts = result.data.items;
			this.moreAvailable = result.data.moreAvailable;
			this.newPosts = result.data.newPosts;
		}
	}

	async loadMore(length: number) {
		analytics.feedPageLoaded(this.selectedCategory, Math.floor(this.posts.length / 10) + 1);
		const result = await this.genericLoad(
			this.getCategories(this.selectedCategory),
			this.sourceId,
			this.posts.at(-1)?.id || null, // '1599259863087190016',
			this.posts.at(0)?.id || null, // '1599259863087190016',
			length,
			true,
		);
		if (result.result && result.data) {
			this.loaded = true;
			this.posts.push(...result.data.items);
			this.moreAvailable = result.data.moreAvailable;
			this.newPosts = result.data.newPosts;
		}
	}

	async loadNew() {
		const result = await this.genericLoad(
			this.getCategories(this.selectedCategory),
			this.sourceId,
			this.posts.at(-1)?.id || null, // '1599259863087190016',
			this.posts.at(0)?.id || null, // '1599259863087190016',
			10,
			false,
		);
		if (result.result && result.data) {
			this.loaded = true;
			this.posts.unshift(...result.data.items);
			this.newPosts = 0;
		}
	}

	constructor() {
		makeObservable(this);
		this.loadCategory('main', null);
	}
}

const feed = new Feed();
//@ts-ignore
window.feed = feed;
export default feed;
