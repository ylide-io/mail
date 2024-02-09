import { action, computed, makeObservable, observable } from 'mobx';

import { MainviewApi } from '../api/mainviewApi';
import {
	AffectedProjectLink,
	ComputedPortfolio,
	PortfolioScope,
	PortfolioSource,
	PortfolioSourceToAffectedProjectsMap,
	ProjectRelation,
	ProjectRelationOrEmpty,
} from '../shared/PortfolioScope';
import domain from './Domain';

const getDefaultCoverage = (): MainviewApi.Coverage => ({
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

const calculateCoverage = (data: MainviewApi.CoverageData[]) => {
	const coverage = data;
	const result: MainviewApi.Coverage = getDefaultCoverage();
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

export class FeedSettings {
	@observable portfolioSources: PortfolioSource[] = [];
	@observable portfolioSourceToAffectedProjects: PortfolioSourceToAffectedProjectsMap = {};

	@observable accesses: { type: 'email' | 'address'; value: string; role: MainviewApi.MVFeedAccessRole }[] = [];

	@observable.shallow portfolio: ComputedPortfolio = {
		totalExposure: 0,
		exposurePerPortfolioSource: [],
		projectToPortfolioMetaMap: {},
	};

	@observable.shallow groups: Record<ProjectRelationOrEmpty, number[]> = {
		[ProjectRelation.ACTIVE_EXPOSURE]: [],
		[ProjectRelation.INTERACTED]: [],
		'': [],
	};

	@observable activeProjectIds: number[] = [];
	@observable defaultActiveSourceIds: Set<number> = new Set();

	@observable includedSourceIds: Set<number> = new Set();
	@observable excludedSourceIds: Set<number> = new Set();

	@observable activeSourceIds: Set<number> = new Set();

	@observable mode: MainviewApi.ConfigMode = MainviewApi.ConfigMode.AUTO_ADD;
	@observable tresholdType: 'value' | 'percent' = 'value';
	@observable tresholdValue = 10000;

	@observable coverageDataByPortfolioSource: Record<string, MainviewApi.CoverageData[]> = {};

	@observable coverageByPortfolioSource: Record<string, MainviewApi.Coverage> = {};
	@observable totalCoverage: MainviewApi.Coverage = getDefaultCoverage();

	constructor(public readonly base: MainviewApi.FeedDataResponse, public readonly feedId: string) {
		this.updateBase(base);

		makeObservable(this);
	}

	@computed get changed() {
		return (
			this.mode !== this.base.feed.mode ||
			this.tresholdType !== this.base.feed.settings.tresholdType ||
			this.tresholdValue !== this.base.feed.settings.tresholdValue ||
			this.portfolioSources.length !== this.base.feed.sources.length ||
			this.portfolioSources.some(
				(s, i) => s.type !== this.base.feed.sources[i].type || s.id !== this.base.feed.sources[i].id,
			) ||
			this.includedSourceIds.size !== this.validOriginalIncludedSourceIds.length ||
			this.excludedSourceIds.size !== this.validOriginalExcludedSourceIds.length ||
			false
		);
	}

	private getValidIncludedSourceIds(defaultActiveSourceIds: Set<number>, includedSourceIds: string[]) {
		const raw = new Set<number>(includedSourceIds.map(Number));
		for (const id of defaultActiveSourceIds) {
			raw.delete(id);
		}
		return [...raw].sort();
	}

	private getValidExcludedSourceIds(defaultActiveSourceIds: Set<number>, excludedSourceIds: string[]) {
		const raw = new Set<number>(excludedSourceIds.map(Number));
		for (const id of raw) {
			if (!defaultActiveSourceIds.has(id)) {
				raw.delete(id);
			}
		}
		return [...raw].sort();
	}

	@computed get validOriginalIncludedSourceIds() {
		return this.getValidIncludedSourceIds(this.defaultActiveSourceIds, this.base.feed.includedSourceIds);
	}

	@computed get validOriginalExcludedSourceIds() {
		return this.getValidExcludedSourceIds(this.defaultActiveSourceIds, this.base.feed.excludedSourceIds);
	}

	private updatePortfolio() {
		const portfolio = PortfolioScope.compute(this.portfolioSources, this.portfolioSourceToAffectedProjects);
		const groups: Record<ProjectRelationOrEmpty, number[]> = {
			[ProjectRelation.ACTIVE_EXPOSURE]: [],
			[ProjectRelation.INTERACTED]: [],
			'': [],
		};

		for (const project of domain.feedSources.projectsArray) {
			const meta = portfolio.projectToPortfolioMetaMap[project.id];
			if (meta) {
				groups[meta.relation].push(project.id);
			} else {
				groups[''].push(project.id);
			}
		}

		groups[ProjectRelation.ACTIVE_EXPOSURE].sort((a, b) => {
			const projectA = portfolio.projectToPortfolioMetaMap[a];
			const projectB = portfolio.projectToPortfolioMetaMap[b];
			const result = (projectB.exposure?.exposure || 0) - (projectA.exposure?.exposure || 0);
			if (result === 0) {
				const aName = domain.feedSources.projectsMap.get(a)?.name || '';
				const bName = domain.feedSources.projectsMap.get(b)?.name || '';
				return aName.localeCompare(bName);
			} else {
				return result;
			}
		});

		groups[ProjectRelation.INTERACTED].sort((a, b) => {
			const aName = domain.feedSources.projectsMap.get(a)?.name || '';
			const bName = domain.feedSources.projectsMap.get(b)?.name || '';
			return aName.localeCompare(bName);
		});

		const coverageByPortfolioSource: Record<string, MainviewApi.Coverage> = {};
		for (const source of this.portfolioSources) {
			coverageByPortfolioSource[source.id] = calculateCoverage(this.coverageDataByPortfolioSource[source.id]);
		}

		this.groups = groups;
		this.portfolio = portfolio;
		this.coverageByPortfolioSource = coverageByPortfolioSource;
		this.totalCoverage = calculateCoverage(
			([] as MainviewApi.CoverageData[]).concat(
				...this.portfolioSources.map(s => this.coverageDataByPortfolioSource[s.id]),
			),
		);

		this.updateActiveProjects(portfolio, this.tresholdType, this.tresholdValue);
	}

	private updateActiveProjects(
		portfolio: ComputedPortfolio,
		tresholdType: 'value' | 'percent',
		tresholdValue: number,
	) {
		const activeProjectIds = PortfolioScope.computeFilters(portfolio, {
			type: tresholdType,
			value: tresholdValue,
		});

		const defaultActiveSourceIds = PortfolioScope.compileSourcesList(
			projectId => (domain.feedSources.sourcesByProjectId.get(projectId) || []).map(s => s.id),
			activeProjectIds,
		);

		this.activeProjectIds = activeProjectIds;
		this.defaultActiveSourceIds = defaultActiveSourceIds;

		this.includedSourceIds = new Set(
			this.getValidIncludedSourceIds(this.defaultActiveSourceIds, [...this.includedSourceIds].map(String)),
		);
		this.excludedSourceIds = new Set(
			this.getValidExcludedSourceIds(this.defaultActiveSourceIds, [...this.excludedSourceIds].map(String)),
		);

		this.updateActiveSourceIds();
	}

	private updateActiveSourceIds() {
		this.activeSourceIds = PortfolioScope.updateSourcesList(
			this.defaultActiveSourceIds,
			this.includedSourceIds,
			this.excludedSourceIds,
		);
	}

	@action
	addPortfolioSource(
		source: PortfolioSource,
		affectedProjectLinks: AffectedProjectLink[],
		coverageData: MainviewApi.CoverageData[],
	) {
		this.portfolioSources.push(source);
		this.portfolioSourceToAffectedProjects[source.id] = affectedProjectLinks;
		this.coverageDataByPortfolioSource[source.id] = coverageData;

		this.updatePortfolio();
	}

	@action
	removePortfolioSource(source: PortfolioSource) {
		delete this.portfolioSourceToAffectedProjects[source.id];
		delete this.coverageDataByPortfolioSource[source.id];
		this.portfolioSources = this.portfolioSources.filter(s => s.id !== source.id);

		this.updatePortfolio();
	}

	@action
	updateBase(base: MainviewApi.FeedDataResponse) {
		this.portfolioSources = base.feed.sources;
		this.portfolioSourceToAffectedProjects = base.portfolioSourceToAffectedProjects;
		this.accesses = base.accesses;

		const coverageDataByPortfolioSource: Record<string, MainviewApi.CoverageData[]> = {};
		for (const portfolioSource of base.feed.sources) {
			if (portfolioSource.type === 'wallet') {
				coverageDataByPortfolioSource[portfolioSource.id] = base.coverage.filter(
					c => c.address === portfolioSource.id,
				);
			} else {
				coverageDataByPortfolioSource[portfolioSource.id] = [];
			}
		}

		this.coverageDataByPortfolioSource = coverageDataByPortfolioSource;

		this.mode = base.feed.mode;
		this.tresholdType = base.feed.settings.tresholdType;
		this.tresholdValue = base.feed.settings.tresholdValue;

		this.includedSourceIds = new Set(base.feed.includedSourceIds.map(Number));
		this.excludedSourceIds = new Set(base.feed.excludedSourceIds.map(Number));

		this.updatePortfolio();
	}

	@action
	updateTreshold(type: 'value' | 'percent', value: number) {
		this.tresholdType = type;
		this.tresholdValue = value;

		this.updateActiveProjects(this.portfolio, this.tresholdType, this.tresholdValue);
	}

	private _activateSource(sourceId: number) {
		this.excludedSourceIds.delete(sourceId);
		if (!this.defaultActiveSourceIds.has(sourceId)) {
			this.includedSourceIds.add(sourceId);
		}
	}

	private _deactivateSource(sourceId: number) {
		this.includedSourceIds.delete(sourceId);
		if (this.defaultActiveSourceIds.has(sourceId)) {
			this.excludedSourceIds.add(sourceId);
		}
	}

	@action
	activateSource(sourceId: number) {
		this._activateSource(sourceId);
		this.updateActiveSourceIds();
	}

	@action
	deactivateSource(sourceId: number) {
		this._deactivateSource(sourceId);
		this.updateActiveSourceIds();
	}

	@action
	activateProject(projectId: number) {
		const feedSources = domain.feedSources.sourcesByProjectId.get(projectId);
		if (!feedSources) {
			return;
		}

		for (const sourceId of feedSources.map(s => s.id)) {
			this._activateSource(sourceId);
		}

		this.updateActiveSourceIds();
	}

	@action
	deactivateProject(projectId: number) {
		const feedSources = domain.feedSources.sourcesByProjectId.get(projectId);
		if (!feedSources) {
			return;
		}

		for (const sourceId of feedSources.map(s => s.id)) {
			this._deactivateSource(sourceId);
		}

		this.updateActiveSourceIds();
	}

	@action
	activateProjects(projectIds: number[]) {
		for (const projectId of projectIds) {
			const feedSources = domain.feedSources.sourcesByProjectId.get(projectId);
			if (!feedSources) {
				return;
			}

			for (const sourceId of feedSources.map(s => s.id)) {
				this._activateSource(sourceId);
			}
		}

		this.updateActiveSourceIds();
	}

	@action
	deactivateProjects(projectIds: number[]) {
		for (const projectId of projectIds) {
			const feedSources = domain.feedSources.sourcesByProjectId.get(projectId);
			if (!feedSources) {
				return;
			}

			for (const sourceId of feedSources.map(s => s.id)) {
				this._deactivateSource(sourceId);
			}
		}

		this.updateActiveSourceIds();
	}

	async save(updateType: string) {
		await MainviewApi.feeds.saveFeed({
			token: domain.session,
			feedId: this.feedId,
			config: {
				mode: this.mode,
				includedSourceIds: [...this.includedSourceIds].map(String),
				excludedSourceIds: [...this.excludedSourceIds].map(String),
				sources: this.portfolioSources,
				settings: {
					tresholdType: this.tresholdType,
					tresholdValue: this.tresholdValue,
				},
			},
			updateType,
		});

		const newBase = await domain.feedsRepository.reloadFeed(this.feedId);
		this.updateBase(newBase);
	}
}
