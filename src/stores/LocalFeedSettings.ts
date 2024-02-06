import { action, computed, IReactionDisposer, makeObservable, observable, reaction, runInAction } from 'mobx';

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

export class LocalFeedSettings {
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

	@observable includeSourceIds: Set<number> = new Set();
	@observable excludeSourceIds: Set<number> = new Set();

	@observable activeSourceIds: Set<number> = new Set();

	@observable tresholdType: 'value' | 'percent' = 'value';
	@observable tresholdValue = 10000;

	@computed get changed() {
		return (
			this.tresholdType !== this.data.feed.settings.tresholdType ||
				this.tresholdValue !== this.data.feed.settings.tresholdValue ||
				this.portfolioSources.length !== this.data.feed.sources.length ||
				this.portfolioSources.some(
					(s, i) => s.type !== this.data.feed.sources[i].type || s.id !== this.data.feed.sources[i].id,
				),
			this.includeSourceIds.size !== this.validIncludedSourceIds.length ||
				this.excludeSourceIds.size !== this.validExcludedSourceIds.length ||
				false
		);
	}

	@computed get loading() {
		return domain.feedSettings.feedDataById.get(this.feedId) === 'loading';
	}

	@computed get error() {
		return domain.feedSettings.feedDataById.get(this.feedId) === 'error';
	}

	@computed get data() {
		const feedData = domain.feedSettings.feedDataById.get(this.feedId);
		if (!feedData || feedData === 'loading' || feedData === 'error') {
			throw new Error(`Don't touch unavailable data. Check it before you try to access it.`);
		}

		return feedData;
	}

	@computed get validIncludedSourceIds() {
		const raw = new Set<number>(this.data.feed.includedSourceIds.map(Number));
		for (const id of this.defaultActiveSourceIds) {
			raw.delete(id);
		}
		return [...raw].sort();
	}

	@computed get validExcludedSourceIds() {
		const raw = new Set<number>(this.data.feed.excludedSourceIds.map(Number));
		for (const id of raw) {
			if (!this.defaultActiveSourceIds.has(id)) {
				raw.delete(id);
			}
		}
		return [...raw].sort();
	}

	disposes: IReactionDisposer[] = [];

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

		const start = Date.now();

		this.groups = groups;
		this.portfolio = portfolio;
		this.updateActiveProjects(portfolio, this.tresholdType, this.tresholdValue);

		const end = Date.now();
		console.log('preparePortfolioData', end - start, 'ms');
	}

	@action
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
	}

	async save() {
		//
	}

	constructor(public readonly feedId: string) {
		makeObservable(this);

		this.load();

		this.disposes.push(
			reaction(
				() => ({
					feedData: domain.feedSettings.feedDataById.get(this.feedId),
				}),
				({ feedData }) => {
					if (!feedData || feedData === 'loading' || feedData === 'error') {
						return;
					}

					runInAction(() => {
						this.portfolioSources = feedData.feed.sources;
						this.portfolioSourceToAffectedProjects = feedData.portfolioSourceToAffectedProjects;
						this.accesses = feedData.accesses;

						this.tresholdType = feedData.feed.settings.tresholdType;
						this.tresholdValue = feedData.feed.settings.tresholdValue;
					});

					this.updatePortfolio();
				},
			),
		);

		this.disposes.push(
			reaction(
				() => ({
					tresholdType: this.tresholdType,
					tresholdValue: this.tresholdValue,
				}),
				({ tresholdType, tresholdValue }) => {
					this.updateActiveProjects(this.portfolio, tresholdType, tresholdValue);
				},
			),
		);

		this.disposes.push(
			reaction(
				() => ({
					defaultActiveSourceIds: new Set(this.defaultActiveSourceIds),
					includeSourceIds: new Set(this.includeSourceIds),
					excludeSourceIds: new Set(this.excludeSourceIds),
				}),
				({ defaultActiveSourceIds, includeSourceIds, excludeSourceIds }) => {
					this.activeSourceIds = PortfolioScope.updateSourcesList(
						defaultActiveSourceIds,
						includeSourceIds,
						excludeSourceIds,
					);
				},
			),
		);
	}

	destroy() {
		this.disposes.forEach(dispose => dispose());
	}

	async load() {
		await domain.feedSettings.loadFeed(this.feedId);
	}
}
