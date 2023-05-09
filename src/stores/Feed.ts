import { makeObservable, observable } from 'mobx';

import { FeedCategory, FeedPost, FeedPostDisplayReason, FeedServerApi } from '../api/feedServerApi';
import { analytics } from './Analytics';
import { browserStorage } from './browserStorage';

export const nonSyntheticFeedCategories = Object.values<FeedCategory>(FeedCategory).filter(
	it => it !== FeedCategory.MAIN && it !== FeedCategory.ALL,
);

export function getFeedCategoryName(category: FeedCategory) {
	if (category === FeedCategory.MAIN) {
		return 'Smart feed';
	} else if (category === FeedCategory.ALL) {
		return 'All topics';
	} else {
		return category;
	}
}

class Feed {
	@observable posts: FeedPost[] = [];
	@observable loaded = false;
	@observable loading = false;

	@observable selectedCategory = FeedCategory.MAIN;
	@observable mainCategories: string[] = JSON.parse(
		localStorage.getItem('t_main_categories') || JSON.stringify(nonSyntheticFeedCategories),
	);

	@observable sourceId: string | undefined;

	@observable newPosts: number = 0;
	@observable moreAvailable = false;
	@observable errorLoading = false;

	constructor() {
		makeObservable(this);
		this.loadCategory(FeedCategory.MAIN);
	}

	private async genericLoad(
		params: {
			needOld: boolean;
			length: number;
			sourceId?: string;
			lastPostId?: string;
			firstPostId?: string;
		},
		isRetryWithNewSourceList: boolean = false,
	): Promise<FeedServerApi.GetPostsResponse | undefined> {
		try {
			this.loading = true;

			const selectedCategory = this.selectedCategory;

			const sourceListId =
				selectedCategory === FeedCategory.MAIN && !params.sourceId
					? browserStorage.feedSourceSettings?.listId
					: undefined;

			const categories =
				params.sourceId || sourceListId
					? undefined
					: selectedCategory === FeedCategory.MAIN
					? this.mainCategories
					: selectedCategory === FeedCategory.ALL
					? nonSyntheticFeedCategories
					: [selectedCategory];

			const response = await FeedServerApi.getPosts({
				...params,
				categories,
				sourceListId,
			});

			// FIXME Temp stuff
			response.items.forEach(it => {
				it.displayReason = {
					reason: FeedPostDisplayReason.HOLDING_TOKEN,
					meta: 'BTC',
				};
			});

			this.loaded = true;
			this.errorLoading = false;

			return response;
		} catch (e) {
			if (
				e instanceof FeedServerApi.FeedServerError &&
				e.code === FeedServerApi.ErrorCode.SOURCE_LIST_NOT_FOUND &&
				!isRetryWithNewSourceList
			) {
				const sourceIds = browserStorage.feedSourceSettings?.sourceIds;
				if (sourceIds) {
					try {
						const data = await FeedServerApi.createSourceList(sourceIds);
						browserStorage.feedSourceSettings = {
							listId: data.sourceListId,
							sourceIds,
						};

						return await this.genericLoad(params, true);
					} catch (e) {}
				}
			}

			this.errorLoading = true;
		} finally {
			this.loading = false;
		}
	}

	async loadCategory(id: FeedCategory, sourceId?: string) {
		analytics.feedPageLoaded(id, 1);

		this.selectedCategory = id;
		this.sourceId = sourceId;
		this.loaded = false;

		const data = await this.genericLoad({
			needOld: true,
			length: 10,
			sourceId,
		});

		if (data) {
			this.posts = data.items;
			this.moreAvailable = data.moreAvailable;
			this.newPosts = data.newPosts;
		}
	}

	async loadMore(length: number) {
		analytics.feedPageLoaded(this.selectedCategory, Math.floor(this.posts.length / 10) + 1);

		const data = await this.genericLoad({
			needOld: true,
			length,
			sourceId: this.sourceId,
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
		const data = await this.genericLoad({
			needOld: false,
			length: 10,
			sourceId: this.sourceId,
			lastPostId: this.posts.at(-1)?.id,
			firstPostId: this.posts.at(0)?.id,
		});

		if (data) {
			this.posts.unshift(...data.items);
			this.newPosts = 0;
		}
	}
}

const feed = new Feed();
//@ts-ignore
window.feed = feed;
export default feed;
