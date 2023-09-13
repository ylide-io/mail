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

	abortController: AbortController | undefined;
	checkNewPostsProcess: NodeJS.Timer | undefined;

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
		checkNewPosts?: boolean;
		signal?: AbortSignal;
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
		this.abortCheckNewPosts();
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
		if (!this.checkNewPostsProcess) {
			this.checkNewPostsProcess = setInterval(() => {
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
			this.moreAvailable = data.moreAvailable;
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

	clearProcess() {
		if (this.checkNewPostsProcess) {
			clearInterval(this.checkNewPostsProcess);
		} else {
			// FeedPage unmounted before process has been created
			// wait for it to cancel successfully
			setTimeout(() => {
				this.clearProcess();
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
		}
	}
}
