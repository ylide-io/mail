import { makeObservable, observable } from 'mobx';

import { FeedServerApi } from '../api/feedServerApi';
import { analytics } from './Analytics';

export enum FeedCategory {
	MAIN = 'main',
	ALL = 'all',
	MARKETS = 'Markets',
	ANALYTICS = 'Analytics',
	PROJECTS = 'Projects',
	POLICY = 'Policy',
	SECURITY = 'Security',
	TECHNOLOGY = 'Technology',
	CULTURE = 'Culture',
	EDUCATION = 'Education',
}

export const nonSyntheticFeedCategories = Object.values(FeedCategory).filter(
	it => it !== FeedCategory.MAIN && it !== FeedCategory.ALL,
);

export function getFeedCategoryName(category: FeedCategory) {
	if (category === FeedCategory.MAIN) {
		return 'My feed';
	} else if (category === FeedCategory.ALL) {
		return 'All topics';
	} else {
		return category;
	}
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

export interface FeedSource {
	id: string;
	category: FeedCategory;
	name: string;
	link: string;
	type: string;
}

class Feed {
	@observable posts: FeedPost[] = [];
	@observable loaded = false;
	@observable loading = false;

	@observable selectedCategory: string = FeedCategory.MAIN;
	@observable mainCategories: string[] = JSON.parse(
		localStorage.getItem('t_main_categories') || JSON.stringify(nonSyntheticFeedCategories),
	);

	@observable sourceId: string | null = null;

	@observable newPosts: number = 0;
	@observable moreAvailable = false;
	@observable errorLoading = false;

	constructor() {
		makeObservable(this);
		this.loadCategory(FeedCategory.MAIN, null).then();
	}

	getCategories(id: string) {
		if (id === FeedCategory.MAIN) {
			return this.mainCategories;
		} else if (id === FeedCategory.ALL) {
			return nonSyntheticFeedCategories;
		} else {
			return [id];
		}
	}

	async genericLoad(params: FeedServerApi.GetPostsParams): Promise<FeedServerApi.GetPostsResponse> {
		this.loading = true;
		try {
			return await FeedServerApi.getPosts(params);
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
		const result = await this.genericLoad({
			categories: this.getCategories(this.selectedCategory),
			needOld: true,
			length: 10,
			sourceId: this.sourceId || undefined,
		});

		if (result.result && result.data) {
			this.loaded = true;
			this.posts = result.data.items;
			this.moreAvailable = result.data.moreAvailable;
			this.newPosts = result.data.newPosts;
		}
	}

	async loadMore(length: number) {
		analytics.feedPageLoaded(this.selectedCategory, Math.floor(this.posts.length / 10) + 1);
		const result = await this.genericLoad({
			categories: this.getCategories(this.selectedCategory),
			needOld: true,
			length,
			sourceId: this.sourceId || undefined,
			lastPostId: this.posts.at(-1)?.id,
			firstPostId: this.posts.at(0)?.id,
		});
		if (result.result && result.data) {
			this.loaded = true;
			this.posts.push(...result.data.items);
			this.moreAvailable = result.data.moreAvailable;
			this.newPosts = result.data.newPosts;
		}
	}

	async loadNew() {
		const result = await this.genericLoad({
			categories: this.getCategories(this.selectedCategory),
			needOld: false,
			length: 10,
			sourceId: this.sourceId || undefined,
			lastPostId: this.posts.at(-1)?.id,
			firstPostId: this.posts.at(0)?.id,
		});
		if (result.result && result.data) {
			this.loaded = true;
			this.posts.unshift(...result.data.items);
			this.newPosts = 0;
		}
	}
}

const feed = new Feed();
//@ts-ignore
window.feed = feed;
export default feed;
