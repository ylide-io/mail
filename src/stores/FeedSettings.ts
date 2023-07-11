import { autorun, makeObservable, observable } from 'mobx';

import { FeedManagerApi } from '../api/feedManagerApi';
import { FeedServerApi, FeedSource } from '../api/feedServerApi';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

export interface FeedSettingsData {
	mode: FeedManagerApi.ConfigMode;
	includedProjectIds: string[];
	excludedProjectIds: string[];
	defaultProjects: FeedManagerApi.UserProject[];
}

export class FeedSettings {
	@observable isError = false;

	@observable.shallow sources: FeedSource[] = [];

	@observable private data = new Map<DomainAccount, FeedSettingsData | 'loading'>();

	constructor() {
		makeObservable(this);

		FeedServerApi.getSources()
			.then(({ sources }) => (this.sources = sources))
			.catch(() => (this.isError = true));

		autorun(() => {
			domain.accounts.activeAccounts
				.filter(account => account.mainViewKey && !this.data.has(account))
				.forEach(async account => {
					try {
						this.data.set(account, 'loading');

						const config = await FeedManagerApi.getConfig({ token: account.mainViewKey });

						this.data.set(account, {
							mode: config.config.mode,
							includedProjectIds: config.config.includedProjectIds,
							excludedProjectIds: config.config.excludedProjectIds,
							defaultProjects: config.defaultProjects,
						});
					} catch (e) {
						this.isError = true;
					}
				});
		});
	}

	getAccountConfig(account: DomainAccount): FeedSettingsData | undefined {
		const data = this.data.get(account);
		if (data && data !== 'loading') return data;
	}

	getSelectedSourceIds(account: DomainAccount) {
		const config = this.getAccountConfig(account);
		if (!config) return [];

		const defaultProjectIds = config.defaultProjects.map(p => p.projectId);

		return this.sources
			.filter(source =>
				source.cryptoProject?.id && defaultProjectIds.includes(source.cryptoProject.id)
					? !config.excludedProjectIds.includes(source.id)
					: config.includedProjectIds.includes(source.id),
			)
			.map(s => s.id);
	}

	isSourceSelected(account: DomainAccount, sourceId: string) {
		return this.getSelectedSourceIds(account).includes(sourceId);
	}

	async updateFeedConfig(account: DomainAccount, selectedSourceIds: string[]) {
		const config = this.getAccountConfig(account);
		if (!config) return;

		const defaultProjectIds = config.defaultProjects.map(p => p.projectId);

		config.excludedProjectIds = this.sources
			.filter(
				source =>
					!selectedSourceIds.includes(source.id) &&
					(!source.cryptoProject?.id || defaultProjectIds.includes(source.cryptoProject.id)),
			)
			.map(s => s.id);

		config.includedProjectIds = this.sources
			.filter(
				source =>
					selectedSourceIds.includes(source.id) &&
					source.cryptoProject?.id &&
					!defaultProjectIds.includes(source.cryptoProject.id),
			)
			.map(s => s.id);

		await FeedManagerApi.setConfig({
			token: account.mainViewKey,
			config: {
				mode: config.mode,
				excludedProjectIds: config.excludedProjectIds,
				includedProjectIds: config.includedProjectIds,
			},
		});
	}
}

export const feedSettings = new FeedSettings();
