import { makeObservable, observable } from 'mobx';

import { FeedPost, FeedServerApi } from '../api/feedServerApi';
import { analytics } from './Analytics';
import domain from './Domain';

const FEED_PAGE_SIZE = 10;

export class FeedStore {
	@observable posts: FeedPost[] = [];

	@observable loaded = false;
	@observable loading = false;
	@observable error: boolean | FeedServerApi.ErrorCode = false;

	@observable newPosts = 0;
	@observable moreAvailable = false;

	abortController: AbortController | undefined;
	checkNewPostsTimer: NodeJS.Timer | undefined;

	constructor(public readonly feed: FeedServerApi.FeedDescriptor) {
		makeObservable(this);
	}

	private async genericLoad(params: {
		needOld: boolean;
		length: number;
		lastPostId?: string;
		firstPostId?: string;
		checkNewPosts?: boolean;
		signal?: AbortSignal;
	}): Promise<FeedServerApi.GetPostsResponse | undefined> {
		try {
			this.loading = true;
			const response = await FeedServerApi.getPosts({
				...params,
				feedDescriptor: this.feed,
				token: domain.session,
			});

			this.loaded = true;
			this.error = false;

			if (params.needOld) {
				if (this.posts.length) {
					analytics.feedLoadMore(this.feed);
				} else {
					analytics.feedView(this.feed);
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
		domain.tooMuch = false;
		this.abortCheckNewPosts();
		if (this.loading) return;

		const data = await this.genericLoad({
			needOld: true,
			length: FEED_PAGE_SIZE,
		});

		if (data) {
			this.posts = data.items;
			this.moreAvailable = data.moreAvailable;
			if (this.newPosts < data.newPosts) {
				navigator.setAppBadge?.(data.newPosts);
			} else {
				navigator.clearAppBadge?.();
			}
			this.newPosts = data.newPosts;
		}
		if (!this.checkNewPostsTimer) {
			this.checkNewPostsTimer = setInterval(() => {
				this.checkNewPosts();
			}, 10000);
		}
	}

	async loadMore() {
		this.abortCheckNewPosts();
		if (this.loading) return;

		const data = await this.genericLoad({
			needOld: true,
			length: FEED_PAGE_SIZE,
			lastPostId: this.posts.at(-1)?.id,
			firstPostId: this.posts.at(0)?.id,
		});

		if (data) {
			this.posts.push(...data.items);
			if (this.posts.length >= 20) {
				domain.tooMuch = true;
			}
			this.moreAvailable = data.moreAvailable;
			if (this.newPosts < data.newPosts) {
				navigator.setAppBadge?.(data.newPosts);
			} else {
				navigator.clearAppBadge?.();
			}
			this.newPosts = data.newPosts;
		}
	}

	async checkNewPosts() {
		if (this.loading) return;
		const firstPostId = this.posts.at(0)?.id;
		if (firstPostId) {
			this.abortController = new AbortController();
			const data = await this.genericLoad({
				needOld: false,
				length: 0,
				checkNewPosts: true,
				firstPostId,
				signal: this.abortController.signal,
			});

			if (data) {
				if (this.newPosts < data.newPosts) {
					navigator.setAppBadge?.(data.newPosts);
				} else {
					navigator.clearAppBadge?.();
				}
				this.newPosts = data.newPosts;
			}
		}
	}

	abortCheckNewPosts() {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = undefined;
			this.loading = false;
		}
	}

	stopNewPostsChecking() {
		if (this.checkNewPostsTimer) {
			clearInterval(this.checkNewPostsTimer);
		} else {
			// FeedPage unmounted before process has been created
			// wait for it to cancel successfully
			setTimeout(() => {
				this.stopNewPostsChecking();
			}, 1000);
		}
	}

	async loadNew() {
		this.abortCheckNewPosts();
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
			navigator.clearAppBadge?.();
		}
	}
}
