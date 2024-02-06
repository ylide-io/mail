import difference from 'lodash.difference';
import { autorun, makeObservable, observable } from 'mobx';

import { MainviewApi } from '../api/mainviewApi';
import { FeedSettingsModal } from '../components/feedSettingsModal/feedSettingsModal';
import { ProjectRelation, ProjectRelationOrEmpty } from '../shared/PortfolioScope';
import { analytics } from './Analytics';
import type { Domain } from './Domain';
import { DomainAccount } from './models/DomainAccount';

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

export class FeedSettings {
	@observable
	isError = false;

	@observable
	feedAccesses: {
		accessLevel: MainviewApi.MVFeedAccessRole;
		feedId: string;
	}[] = [];

	@observable
	readonly feedDataById = new Map<string, MainviewApi.FeedDataResponse | 'loading' | 'error'>();

	@observable
	private defaultAccountFeedId = new Map<DomainAccount, string>();

	@observable
	tags: { id: number; name: string }[] | 'loading' | 'error' = 'loading';

	getFeedData(account: DomainAccount): MainviewApi.FeedDataResponse | 'loading' | 'error' | undefined {
		const feedId = this.defaultAccountFeedId.get(account);
		if (!feedId) return undefined;

		return this.feedDataById.get(feedId);
	}

	async loadFeed(feedId: string, mainviewKey?: string) {
		if (!mainviewKey) {
			if (this.domain.account?.mainviewKey) {
				mainviewKey = this.domain.account.mainviewKey;
			} else {
				throw new Error('Unauthorized');
			}
		}
		this.feedDataById.set(feedId, 'loading');
		await MainviewApi.getFeedData({ token: mainviewKey, feedId: feedId })
			.then(feedData => {
				this.feedDataById.set(feedId, feedData);
			})
			.catch(() => {
				this.feedDataById.set(feedId, 'error');
			});
	}

	constructor(public readonly domain: Domain) {
		makeObservable(this);

		MainviewApi.getTags()
			.then(r => {
				this.tags = r;
			})
			.catch(e => {
				console.log(`Error fetching tags - ${e}`);
			});

		autorun(() => {
			if (domain.account) {
				const acc = domain.account;
				(async () => {
					try {
						MainviewApi.getFeeds({ token: acc.mainviewKey }).then(({ feeds }) => {
							this.feedAccesses = feeds.map(f => ({
								accessLevel: f.accessLevel,
								feedId: f.data.feed.id,
							}));
							for (const feed of feeds) {
								this.feedDataById.set(feed.data.feed.id, feed.data);
							}
						});
					} catch (e) {
						this.isError = true;
					}
				})();
			}
		});
	}

	// getSelectedSourceIds(feedId: string) {
	// 	const config = this.feedDataById.get(feedId);
	// 	if (!config || config === 'loading' || config === 'error') return [];

	// 	const defaultProjectIds = Object.values(config.projectsByPortfolioSource)
	// 		.map(projects => projects.map(p => p.id))
	// 		.flat();

	// 	return this.sources
	// 		.filter(source =>
	// 			source.cryptoProject?.id && defaultProjectIds.includes(source.cryptoProject.id)
	// 				? !config.feed.excludedSourceIds.includes(source.id)
	// 				: config.feed.includedSourceIds.includes(source.id),
	// 		)
	// 		.map(s => s.id);
	// }

	// isSourceSelected(feedId: string, sourceId: string) {
	// 	return this.getSelectedSourceIds(feedId).includes(sourceId);
	// }

	// async updateFeedConfig(feedId: string, selectedSourceIds: string[]) {
	// 	const config = this.feedDataById.get(feedId);
	// 	if (!config || config === 'loading' || config === 'error') return [];

	// 	const initiallySelectedSourceIds = this.getSelectedSourceIds(feedId);
	// 	const sourceIdsToRemove = difference(initiallySelectedSourceIds, selectedSourceIds);
	// 	const sourceIdsToAdd = difference(selectedSourceIds, initiallySelectedSourceIds);

	// 	if (sourceIdsToRemove.length) {
	// 		analytics.mainviewFeedSettingsRemoveSources(account.address, sourceIdsToRemove);
	// 	}
	// 	if (sourceIdsToAdd.length) {
	// 		analytics.mainviewFeedSettingsAddSources(account.address, sourceIdsToAdd);
	// 	}

	// 	const defaultProjectIds = config.defaultProjects.map(p => p.projectId);

	// 	config.excludedSourceIds = this.sources
	// 		.filter(
	// 			source =>
	// 				!selectedSourceIds.includes(source.id) &&
	// 				source.cryptoProject?.id &&
	// 				defaultProjectIds.includes(source.cryptoProject.id),
	// 		)
	// 		.map(s => s.id);

	// 	config.includedSourceIds = this.sources
	// 		.filter(
	// 			source =>
	// 				selectedSourceIds.includes(source.id) &&
	// 				(!source.cryptoProject?.id || !defaultProjectIds.includes(source.cryptoProject.id)),
	// 		)
	// 		.map(s => s.id);

	// 	await MainviewApi.setConfig({
	// 		token: account.mainviewKey,
	// 		config: {
	// 			mode: config.mode,
	// 			excludedSourceIds: config.excludedSourceIds,
	// 			includedSourceIds: config.includedSourceIds,
	// 		},
	// 	});
	// }

	// async unfollowProject(feedId: string, projectId: string) {
	// 	try {
	// 		const sourceIdsToExclude = this.sources.filter(s => s.cryptoProject?.id === projectId).map(s => s.id);

	// 		const selectedSourceIds = this.getSelectedSourceIds(feedId).filter(id => !sourceIdsToExclude.includes(id));

	// 		// await domain.feedSettings.updateFeedConfig(account, selectedSourceIds);
	// 	} catch (e) {
	// 		throw e;
	// 	}
	// }

	// async unfollowSource(feedId: string, sourceId: string) {
	// 	try {
	// 		const selectedSourceIds = this.getSelectedSourceIds(feedId).filter(id => id !== sourceId);

	// 		// await domain.feedSettings.updateFeedConfig(account, selectedSourceIds);
	// 	} catch (e) {
	// 		throw e;
	// 	}
	// }
}
