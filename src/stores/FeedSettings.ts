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

		this.groups = groups;
		this.portfolio = portfolio;

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
	addPortfolioSource(source: PortfolioSource, affectedProjectLinks: AffectedProjectLink[]) {
		this.portfolioSources.push(source);
		this.portfolioSourceToAffectedProjects[source.id] = affectedProjectLinks;

		this.updatePortfolio();
	}

	@action
	removePortfolioSource(source: PortfolioSource) {
		delete this.portfolioSourceToAffectedProjects[source.id];
		this.portfolioSources = this.portfolioSources.filter(s => s.id !== source.id);

		this.updatePortfolio();
	}

	@action
	updateBase(base: MainviewApi.FeedDataResponse) {
		this.portfolioSources = base.feed.sources;
		this.portfolioSourceToAffectedProjects = base.portfolioSourceToAffectedProjects;
		this.accesses = base.accesses;

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

	async save() {
		await MainviewApi.saveFeed({
			token: domain.account!.token,
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
		});

		const newBase = await domain.feedsRepository.reloadFeed(this.feedId);
		this.updateBase(newBase);
	}
}
