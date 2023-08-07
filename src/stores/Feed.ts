import { makeObservable, observable } from 'mobx';

import { FeedPost, FeedServerApi } from '../api/feedServerApi';
import { analytics } from './Analytics';

const FEED_PAGE_SIZE = 10;

export class FeedStore {
	@observable posts: FeedPost[] = [];

	@observable loaded = false;
	@observable loading = false;
	@observable error: boolean | FeedServerApi.ErrorCode = false;

	@observable newPosts = 0;
	@observable moreAvailable = false;

	readonly tags: { id: number; name: string }[] = [];
	readonly sourceId: string | undefined;
	readonly addressTokens: string[] | undefined;

	constructor(params: { tags?: { id: number; name: string }[]; sourceId?: string; addressTokens?: string[] }) {
		if (params.tags) {
			this.tags = params.tags;
		}
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
			const tags = sourceId ? undefined : this.tags.map(t => t.id);

			const response = await FeedServerApi.getPosts({
				...params,
				tags,
				sourceId,
				addressTokens: this.addressTokens,
			});

			this.loaded = true;
			this.error = false;

			if (params.needOld) {
				if (this.posts.length) {
					analytics.feedLoadMore(this.tags.map(t => t.id));
				} else {
					analytics.feedView(this.tags.map(t => t.id));
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
