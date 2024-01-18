import difference from 'lodash.difference';
import { autorun, makeObservable, observable } from 'mobx';

import { FeedManagerApi } from '../api/feedManagerApi';
import { FeedReason, FeedReasonOrEmpty, FeedServerApi, FeedSource } from '../api/feedServerApi';
import { analytics } from './Analytics';
import type { Domain } from './Domain';
import { DomainAccount } from './models/DomainAccount';

export interface FeedSettingsData {
	mode: FeedManagerApi.ConfigMode;
	includedSourceIds: string[];
	excludedSourceIds: string[];
	defaultProjects: FeedManagerApi.UserProject[];
}

const getDefaultCoverage = (): FeedManagerApi.Coverage => ({
	tokens: {
		items: [],
		ratio: 0,
		ratioUsd: 0,
		coveredCount: 0,
		usdTotal: 0,
		usdCovered: 0,
		total: 0,
	},
	protocols: {
		items: [],
		ratio: 0,
		ratioUsd: 0,
		coveredCount: 0,
		usdTotal: 0,
		usdCovered: 0,
		total: 0,
	},
	totalCoverage: 'N/A',
});

const calculateCoverage = (data: FeedManagerApi.CoverageData[]) => {
	const coverage = data;
	const result: FeedManagerApi.Coverage = getDefaultCoverage();
	for (const c of coverage) {
		if (c.missing) {
			for (const reason of c.reasonsData) {
				if (reason.type === 'balance') {
					result.tokens.items.push({
						tokenId: c.tokenId,
						name: c.tokenName,
						symbol: c.tokenSymbol,
						missing: c.missing,
						projectName: c.projectName,
					});
					result.tokens.usdTotal += reason.balanceUsd;
				} else if (reason.type === 'protocol') {
					result.protocols.items.push({
						tokenId: c.tokenId,
						name: c.protocolName,
						symbol: c.protocolTokenSymbol,
						missing: c.missing,
						projectName: c.projectName,
					});
					let sum = 0;
					if ('portfolio_item_list' in reason.data) {
						sum = reason.data.portfolio_item_list.reduce((acc, s) => acc + s.stats.net_usd_value, 0);
					} else if ('pools' in reason.data) {
						sum =
							Number(reason.data.liquidity?.totalUsdValue || 0) +
							reason.data.pools.reduce((acc, p) => {
								acc += Number(p.totalUsdValue);
								return acc;
							}, 0);
					}
					result.protocols.usdTotal += sum;
				}
			}
		} else {
			for (const reason of c.reasonsData) {
				if (reason.type === 'balance') {
					result.tokens.items.push({
						tokenId: c.tokenId,
						name: c.tokenName,
						symbol: c.tokenSymbol,
						missing: c.missing,
						projectName: c.projectName,
					});
					result.tokens.coveredCount += 1;
					result.tokens.usdTotal += reason.balanceUsd;
					result.tokens.usdCovered += reason.balanceUsd;
				} else if (reason.type === 'protocol') {
					result.protocols.items.push({
						tokenId: c.tokenId,
						name: c.protocolName,
						symbol: c.protocolTokenSymbol,
						missing: c.missing,
						projectName: c.projectName,
					});
					let sum = 0;
					if ('portfolio_item_list' in reason.data) {
						sum = reason.data.portfolio_item_list.reduce((acc, s) => acc + s.stats.net_usd_value, 0);
					} else if ('pools' in reason.data) {
						sum =
							Number(reason.data.liquidity?.totalUsdValue || 0) +
							reason.data.pools.reduce((acc, p) => {
								acc += Number(p.totalUsdValue);
								return acc;
							}, 0);
					}
					result.protocols.usdTotal += sum;
					result.protocols.usdCovered += sum;
					result.protocols.coveredCount += 1;
				}
			}
		}
	}

	result.tokens.total = result.tokens.items.length;
	result.protocols.total = result.protocols.items.length;

	result.tokens.usdCovered = Math.floor(result.tokens.usdCovered);
	result.tokens.usdTotal = Math.floor(result.tokens.usdTotal);

	result.protocols.usdTotal = Math.floor(result.protocols.usdTotal);
	result.protocols.usdCovered = Math.floor(result.protocols.usdCovered);

	if (result.tokens.items.length) {
		result.tokens.ratio = Math.floor((result.tokens.coveredCount * 100) / result.tokens.items.length);
	}
	if (result.tokens.usdTotal) {
		result.tokens.ratioUsd = Math.floor((result.tokens.usdCovered * 100) / result.tokens.usdTotal);
	}
	if (result.protocols.items.length) {
		result.protocols.ratio = Math.floor((result.protocols.coveredCount * 100) / result.protocols.items.length);
	}
	if (result.protocols.usdTotal) {
		result.protocols.ratioUsd = Math.floor((result.protocols.usdCovered * 100) / result.protocols.usdTotal);
	}
	const total = result.tokens.usdTotal + result.protocols.usdTotal;
	const covered = result.tokens.usdCovered + result.protocols.usdCovered;
	const totalResult = total > 0 ? (covered * 100) / total : 0;
	result.totalCoverage = total === 0 ? 'N/A' : totalResult === 100 ? '100%' : `${totalResult.toFixed(1)}%`;
	return result;
};

export const getReasonOrder = (reasons: FeedReasonOrEmpty[]) =>
	reasons.sort((a: FeedReasonOrEmpty, b: FeedReasonOrEmpty) => {
		const getOrder = (reason: FeedReasonOrEmpty) =>
			({ [FeedReason.BALANCE]: 1, [FeedReason.PROTOCOL]: 2, [FeedReason.TRANSACTION]: 3, '': 4 }[reason]);
		return getOrder(a) - getOrder(b);
	});

export class FeedSettings {
	@observable
	isError = false;

	@observable.shallow
	sources: FeedSource[] = [];

	@observable
	private configs = new Map<DomainAccount, FeedSettingsData | 'loading'>();

	@observable
	coverages = new Map<DomainAccount, FeedManagerApi.Coverage | 'loading' | 'error'>();

	@observable
	tags: { id: number; name: string }[] | 'loading' | 'error' = 'loading';

	constructor(domain: Domain) {
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
			if (domain.account && !this.configs.has(domain.account)) {
				const acc = domain.account;
				(async () => {
					try {
						this.configs.set(acc, 'loading');
						this.coverages.set(acc, 'loading');

						const [configResponse, coverageResponse] = await Promise.allSettled([
							FeedManagerApi.getConfig({ token: acc.mainviewKey }),
							FeedManagerApi.getCoverage(acc.mainviewKey),
						]);
						if (configResponse.status === 'fulfilled') {
							const { config, defaultProjects } = configResponse.value;
							this.configs.set(acc, {
								mode: config.mode,
								includedSourceIds: config.includedSourceIds,
								excludedSourceIds: config.excludedSourceIds,
								defaultProjects: defaultProjects.map(p => {
									// @ts-ignore
									p.reasons = getReasonOrder(p.reasons);
									return p;
								}),
							});
						} else {
							this.isError = true;
							console.log(`Failed to get config - ${configResponse.reason}`);
						}
						if (coverageResponse.status === 'fulfilled') {
							const coverage = calculateCoverage(coverageResponse.value);
							this.coverages.set(acc, coverage);
						} else {
							this.coverages.set(acc, 'error');
							console.log(`Failed to get coverage - ${coverageResponse.reason}`);
						}
					} catch (e) {
						this.isError = true;
					}
				})();
			}
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
				source.cryptoProject?.id && defaultProjectIds.includes(source.cryptoProject.id)
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
			analytics.mainviewFeedSettingsRemoveSources(account.address, sourceIdsToRemove);
		}
		if (sourceIdsToAdd.length) {
			analytics.mainviewFeedSettingsAddSources(account.address, sourceIdsToAdd);
		}

		const defaultProjectIds = config.defaultProjects.map(p => p.projectId);

		config.excludedSourceIds = this.sources
			.filter(
				source =>
					!selectedSourceIds.includes(source.id) &&
					source.cryptoProject?.id &&
					defaultProjectIds.includes(source.cryptoProject.id),
			)
			.map(s => s.id);

		config.includedSourceIds = this.sources
			.filter(
				source =>
					selectedSourceIds.includes(source.id) &&
					(!source.cryptoProject?.id || !defaultProjectIds.includes(source.cryptoProject.id)),
			)
			.map(s => s.id);

		await FeedManagerApi.setConfig({
			token: account.mainviewKey,
			config: {
				mode: config.mode,
				excludedSourceIds: config.excludedSourceIds,
				includedSourceIds: config.includedSourceIds,
			},
		});
	}
}
