import { makeObservable, observable } from 'mobx';

import { FeedCategory, FeedPost, FeedServerApi } from '../api/feedServerApi';
import { analytics } from './Analytics';

export function getFeedCategoryName(category: FeedCategory) {
	return category;
}

const FEED_PAGE_SIZE = 10;

export class FeedStore {
	@observable posts: FeedPost[] = [];

	@observable loaded = false;
	@observable loading = false;
	@observable error: boolean | FeedServerApi.ErrorCode = false;

	@observable newPosts = 0;
	@observable moreAvailable = false;

	readonly categories: FeedCategory[] = [];
	readonly sourceId: string | undefined;
	readonly addressTokens: string[] | undefined;

	constructor(params: { categories?: FeedCategory[]; sourceId?: string; addressTokens?: string[] }) {
		this.categories = params.categories || [];
		this.sourceId = params.sourceId;
		this.addressTokens = params.addressTokens;

		makeObservable(this);
	}

	private async genericLoad(params: {
		needOld: boolean;
		length: number;
		lastPostId?: string;
		firstPostId?: string;
	}): Promise<FeedServerApi.GetPostsResponse | undefined> {
		try {
			this.loading = true;

			const sourceId = this.sourceId;
			const categories = sourceId ? undefined : this.categories;

			const response = await FeedServerApi.getPosts({
				...params,
				categories,
				sourceId,
				addressTokens: this.addressTokens,
			});

			this.loaded = true;
			this.error = false;

			if (params.needOld) {
				if (this.posts.length) {
					analytics.feedLoadMore(this.categories);
				} else {
					analytics.feedView(this.categories);
				}
			}

			return response;
		} catch (e) {
			if (e instanceof FeedServerApi.FeedServerError) {
				this.error = e.code;
			} else {
				this.error = true;
			}
		} finally {
			this.loading = false;
		}
	}

	async load() {
		if (this.loading) return;

		const data = await this.genericLoad({
			needOld: true,
			length: FEED_PAGE_SIZE,
		});

		if (data) {
			this.posts = data.items;
			this.moreAvailable = data.moreAvailable;
			this.newPosts = data.newPosts;
		}
	}

	async loadMore() {
		if (this.loading) return;

		const data = await this.genericLoad({
			needOld: true,
			length: FEED_PAGE_SIZE,
			lastPostId: this.posts.at(-1)?.id,
			firstPostId: this.posts.at(0)?.id,
		});

		if (data) {
			this.posts.push(...data.items);
			this.moreAvailable = data.moreAvailable;
			this.newPosts = data.newPosts;
		}
	}

	async loadNew() {
		if (this.loading) return;

		const data = await this.genericLoad({
			needOld: false,
			length: FEED_PAGE_SIZE,
			lastPostId: this.posts.at(-1)?.id,
			firstPostId: this.posts.at(0)?.id,
		});

		if (data) {
			this.posts.unshift(...data.items);
			this.newPosts = 0;
		}
	}
}
