import { autorun, makeObservable, observable } from 'mobx';

import { MainviewApi } from '../api/mainviewApi';
import { ProjectRelation, ProjectRelationOrEmpty } from '../shared/PortfolioScope';
import type { Domain } from './Domain';
import { FeedSettings } from './FeedSettings';

export const getReasonOrder = (reasons: ProjectRelationOrEmpty[]) =>
	reasons.sort((a: ProjectRelationOrEmpty, b: ProjectRelationOrEmpty) => {
		const getOrder = (reason: ProjectRelationOrEmpty) =>
			({
				[ProjectRelation.ACTIVE_EXPOSURE]: 1,
				[ProjectRelation.INTERACTED]: 2,
				'': 3,
			}[reason]);
		return getOrder(a) - getOrder(b);
	});

export class FeedsRepository {
	@observable
	isError = false;

	@observable
	feedAccesses: {
		accessLevel: MainviewApi.MVFeedAccessRole;
		feedId: string;
	}[] = [];

	@observable
	readonly feedDataById = new Map<string, MainviewApi.FeedDataResponse>();

	@observable
	readonly feedSettingsById = new Map<string, FeedSettings>();

	@observable
	tags: { id: number; name: string }[] | 'loading' | 'error' = 'loading';

	constructor(public readonly domain: Domain) {
		makeObservable(this);

		MainviewApi.general
			.getTags()
			.then(r => {
				this.tags = r;
			})
			.catch(e => {
				console.log(`Error fetching tags - ${e}`);
			});

		autorun(() => {
			if (domain.account) {
				try {
					MainviewApi.feeds.getFeeds({ token: domain.session }).then(({ feeds }) => {
						this.feedAccesses = feeds.map(f => ({
							accessLevel: f.accessLevel,
							feedId: f.data.feed.id,
						}));
						for (const feed of feeds) {
							this.feedDataById.set(feed.data.feed.id, feed.data);
							this.feedSettingsById.set(
								feed.data.feed.id,
								new FeedSettings(feed.data, feed.data.feed.id),
							);
						}
					});
				} catch (e) {
					this.isError = true;
				}
			}
		});
	}

	async reloadFeed(feedId: string) {
		const feedData = await MainviewApi.feeds.getFeedData({ token: this.domain.session, feedId: feedId });
		if (feedData) {
			this.feedDataById.set(feedId, feedData);
			this.feedSettingsById.get(feedId)?.updateBase(feedData);
		}
		return feedData;
	}
}
