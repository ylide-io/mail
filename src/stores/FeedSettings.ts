import difference from 'lodash.difference';
import { autorun, makeObservable, observable } from 'mobx';

import { FeedManagerApi } from '../api/feedManagerApi';
import { FeedReason, FeedServerApi, FeedSource, TokenInProtocol } from '../api/feedServerApi';
import { analytics } from './Analytics';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

export interface FeedSettingsData {
	mode: FeedManagerApi.ConfigMode;
	includedSourceIds: string[];
	excludedSourceIds: string[];
	defaultProjects: FeedManagerApi.DefaultProject[];
}

export class FeedSettings {
	@observable
	isError = false;

	@observable.shallow
	sources: FeedSource[] = [];

	@observable
	private configs = new Map<DomainAccount, FeedSettingsData | 'loading'>();

	@observable
	coverages = new Map<DomainAccount, FeedManagerApi.Coverage | 'loading'>();

	@observable
	tags: { id: number; name: string }[] | 'loading' | 'error' = 'loading';

	constructor() {
		makeObservable(this);

		FeedManagerApi.getTags()
			.then(r => {
				this.tags = r;
			})
			.catch(e => {
				console.log(`Error fetching tags - ${e}`);
			});

		FeedServerApi.getSources()
			.then(({ sources }) => (this.sources = sources))
			.catch(() => (this.isError = true));

		autorun(() => {
			domain.accounts.activeAccounts
				.filter(account => account.mainViewKey && !this.configs.has(account))
				.forEach(async account => {
					try {
						this.configs.set(account, 'loading');
						this.coverages.set(account, 'loading');

						const configResponse = await FeedManagerApi.getConfig({
							token: account.mainViewKey,
						});

						const { config, defaultProjects } = configResponse;
						this.configs.set(account, {
							mode: config.mode,
							includedSourceIds: config.includedSourceIds,
							excludedSourceIds: config.excludedSourceIds,
							defaultProjects: defaultProjects,
						});
						const coverage: FeedManagerApi.Coverage = {
							tokens: {
								items: [],
								ratio: 0,
								coveredCount: 0,
								total: 0,
								ratioUsd: 0,
								usdTotal: 0,
								usdCovered: 0,
							},
							protocols: {
								items: [],
								ratio: 0,
								coveredCount: 0,
								total: 0,
								ratioUsd: 0,
								usdTotal: 0,
								usdCovered: 0,
							},
							totalCoverage: '',
						};
						for (const project of defaultProjects) {
							for (const { id, data } of project.reasonsData) {
								for (const d of data) {
									if (d.type === FeedReason.BALANCE) {
										coverage.tokens.items.push({
											tokenId: id,
											covered: project.covered,
											projectName: project.projectName,
											symbol: d.symbol,
										});
										if (project.covered) {
											coverage.tokens.coveredCount += 1;
											coverage.tokens.usdCovered += d.balanceUsd || 0;
										}
										coverage.tokens.usdTotal += d.balanceUsd || 0;
										coverage.tokens.total += 1;
									} else if (d.type === FeedReason.PROTOCOL) {
										coverage.protocols.items.push({
											tokenId: id,
											covered: project.covered,
											projectName: project.projectName,
										});
										if (project.covered) {
											coverage.protocols.coveredCount += 1;
										}
										coverage.protocols.total += 1;
										if (d.tokens) {
											for (const token of d.tokens) {
												if (token.type === TokenInProtocol.BORROW) {
													continue;
												}
												const projectToken = defaultProjects.find(data =>
													data.reasonsData.some(({ id }) => id === token.id),
												);
												if (projectToken && projectToken.projectId !== 0) {
													coverage.tokens.usdCovered += token.balanceUsd;
												}
												coverage.tokens.usdTotal += token.balanceUsd;
											}
										}
									}
								}
							}
						}
						coverage.tokens.usdCovered = Math.floor(coverage.tokens.usdCovered);
						coverage.tokens.usdTotal = Math.floor(coverage.tokens.usdTotal);

						coverage.protocols.usdTotal = Math.floor(coverage.protocols.usdTotal);
						coverage.protocols.usdCovered = Math.floor(coverage.protocols.usdCovered);

						if (coverage.tokens.total) {
							coverage.tokens.ratio = Math.floor(
								(coverage.tokens.coveredCount * 100) / coverage.tokens.total,
							);
						}
						if (coverage.tokens.usdTotal) {
							coverage.tokens.ratioUsd = Math.floor(
								(coverage.tokens.usdCovered * 100) / coverage.tokens.usdTotal,
							);
						}
						if (coverage.protocols.total) {
							coverage.protocols.ratio = Math.floor(
								(coverage.protocols.coveredCount * 100) / coverage.protocols.total,
							);
						}
						if (coverage.protocols.usdTotal) {
							coverage.protocols.ratioUsd = Math.floor(
								(coverage.protocols.usdCovered * 100) / coverage.protocols.usdTotal,
							);
						}
						const total = coverage.tokens.usdTotal + coverage.protocols.usdTotal;
						const covered = coverage.tokens.usdCovered + coverage.protocols.usdCovered;
						const result = total > 0 ? (covered * 100) / total : 0;
						coverage.totalCoverage =
							total === 0 ? 'N/A' : result === 100 ? '100%' : `${result.toFixed(1)}%`;
						console.log(coverage);
						this.coverages.set(account, coverage);
					} catch (e) {
						this.isError = true;
					}
				});
		});
	}

	getAccountConfig(account: DomainAccount): FeedSettingsData | undefined {
		const config = this.configs.get(account);
		if (config && config !== 'loading') return config;
	}

	getSelectedSourceIds(account: DomainAccount) {
		const config = this.getAccountConfig(account);
		if (!config) return [];

		const defaultProjectIds = config.defaultProjects.map(p => p.projectId);

		return this.sources
			.filter(source =>
				source.cryptoProject?.id && defaultProjectIds.includes(Number(source.cryptoProject.id))
					? !config.excludedSourceIds.includes(source.id)
					: config.includedSourceIds.includes(source.id),
			)
			.map(s => s.id);
	}

	isSourceSelected(account: DomainAccount, sourceId: string) {
		return this.getSelectedSourceIds(account).includes(sourceId);
	}

	async updateFeedConfig(account: DomainAccount, selectedSourceIds: string[]) {
		const config = this.getAccountConfig(account);
		if (!config) return;

		const initiallySelectedSourceIds = this.getSelectedSourceIds(account);
		const sourceIdsToRemove = difference(initiallySelectedSourceIds, selectedSourceIds);
		const sourceIdsToAdd = difference(selectedSourceIds, initiallySelectedSourceIds);

		if (sourceIdsToRemove.length) {
			analytics.mainviewFeedSettingsRemoveSources(account.account.address, sourceIdsToRemove);
		}
		if (sourceIdsToAdd.length) {
			analytics.mainviewFeedSettingsAddSources(account.account.address, sourceIdsToAdd);
		}

		const defaultProjectIds = config.defaultProjects.map(p => p.projectId);

		config.excludedSourceIds = this.sources
			.filter(
				source =>
					!selectedSourceIds.includes(source.id) &&
					source.cryptoProject?.id &&
					defaultProjectIds.includes(Number(source.cryptoProject.id)),
			)
			.map(s => s.id);

		config.includedSourceIds = this.sources
			.filter(
				source =>
					selectedSourceIds.includes(source.id) &&
					(!source.cryptoProject?.id || !defaultProjectIds.includes(Number(source.cryptoProject.id))),
			)
			.map(s => s.id);

		await FeedManagerApi.setConfig({
			token: account.mainViewKey,
			config: {
				mode: config.mode,
				excludedSourceIds: config.excludedSourceIds,
				includedSourceIds: config.includedSourceIds,
			},
		});
	}
}

export const feedSettings = new FeedSettings();
