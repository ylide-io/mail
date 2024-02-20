import { FeedSourcesScope } from './FeedSourcesScope';

export enum ProjectRelation {
	ACTIVE_EXPOSURE = 'active-exposure',
	INTERACTED = 'interacted',
}

export type ProjectRelationOrEmpty = ProjectRelation | '';

export type EntityRelation =
	| {
			type: 'protocol';
			data: any;
			tokens: {
				id: string;
				type: 'supply' | 'reward';
				symbol: string;
				balanceUsd: number | string;
			}[];
	  }
	| {
			type: 'balance-in-protocol';
			protocol: string;
			subtype: 'supply' | 'reward';
			balanceUsd: number | string;
			symbol: string;
	  }
	| {
			type: 'balance';
			balanceUsd: number;
			symbol: string;
	  }
	| {
			type: 'transaction';
			id: string;
	  };

export interface RelatedEntity {
	entityId: string;
	relations: EntityRelation[];
}

export interface RelatedEntityForPortfolioSource extends RelatedEntity {
	portfolioSourceId: string;
}

export interface AffectedProjectLink {
	projectId: number;
	relatedEntities: RelatedEntity[];
}

export interface AffectedPortfolioSourceLink {
	portfolioSourceId: string;
	relatedEntities: RelatedEntity[];
}

export interface PortfolioSource {
	type: 'wallet' | 'external-api';
	id: string;
}

export interface ProjectExposureEntry {
	left: { id: string; symbol: string };
	leftValueUsd: number;
	right: { id: string } | null; // null for balance; symbol: string
	mine: 'left' | 'right';
}

export interface Exposure {
	total: number;
	totalBalance: number;
	totalProtocols: number;
}

export interface ProjectExposure extends Exposure {
	entries: ProjectExposureEntry[];
}

export interface ProjectExposureCompiled {
	exposure: number;
	exposurePercentage: number;
	exposurePerPortfolioSource: ProjectExposure[];
}

export interface ProjectPortfolioMeta {
	relation: ProjectRelation;
	exposure: ProjectExposureCompiled | null;
}

export interface ComputedPortfolio {
	totalExposure: number;
	exposurePerPortfolioSource: Exposure[];
	projectToPortfolioMetaMap: Record<string, ProjectPortfolioMeta>;
}

export type PortfolioSourceToAffectedProjectsMap = Record<string, AffectedProjectLink[]>;
export type ProjectToAffectedPortfolioSourcesMap = Record<string, AffectedPortfolioSourceLink[]>;
export type ProjectToRelatedEntitiesMap = Record<string, RelatedEntityForPortfolioSource[]>;

export class PortfolioScope {
	static getProjectToAffectedPortfolioSourcesMap(
		portfolioSourceToAffectedProjectsMap: PortfolioSourceToAffectedProjectsMap,
	) {
		const reverseMap: ProjectToAffectedPortfolioSourcesMap = {};

		for (const [portfolioSourceId, projects] of Object.entries(portfolioSourceToAffectedProjectsMap)) {
			for (const project of projects) {
				reverseMap[project.projectId] = reverseMap[project.projectId] || [];
				reverseMap[project.projectId].push({ portfolioSourceId, relatedEntities: project.relatedEntities });
			}
		}

		return reverseMap;
	}

	static getProjectToRelatedEntitiesMap(projectToAffectedPortfolioSourcesMap: ProjectToAffectedPortfolioSourcesMap) {
		const reverseMap: ProjectToRelatedEntitiesMap = {};

		for (const [projectId, portfolioSources] of Object.entries(projectToAffectedPortfolioSourcesMap)) {
			for (const portfolioSource of portfolioSources) {
				reverseMap[projectId] = reverseMap[projectId] || [];
				reverseMap[projectId].push(
					...portfolioSource.relatedEntities.map(re => ({
						...re,
						portfolioSourceId: portfolioSource.portfolioSourceId,
					})),
				);
			}
		}

		return reverseMap;
	}

	static calculateExposureToProject(
		portfolioSources: PortfolioSource[],
		relatedEntities: RelatedEntityForPortfolioSource[],
	): ProjectExposureCompiled {
		const relatedEntitiesPerPortfolioSource = portfolioSources.map(ps => {
			return {
				source: ps,
				relatedEntities: relatedEntities.filter(r => r.portfolioSourceId === ps.id),
			};
		});

		const exposurePerPortfolioSource = relatedEntitiesPerPortfolioSource.map(({ source, relatedEntities }) => {
			const protocolEntities = relatedEntities.filter(r => r.relations.some(rd => rd.type === 'protocol'));
			const otherEntities = relatedEntities.filter(r => !r.relations.some(rd => rd.type === 'protocol'));

			let totalBalance = 0;
			let totalProtocols = 0;
			let ignoreList = new Set<string>();

			const entries: ProjectExposureEntry[] = [];

			for (const entity of protocolEntities) {
				const protocols = entity.relations.filter(rd => rd.type === 'protocol');
				for (const relationEntry of protocols) {
					if (relationEntry.type === 'protocol') {
						for (const token of relationEntry.tokens) {
							totalProtocols += Number(token.balanceUsd);
							ignoreList.add(entity.entityId + ':' + token.id); // arb:arb_curve:arb:0x123
							entries.push({
								left: { id: token.id, symbol: token.symbol },
								leftValueUsd: Number(token.balanceUsd),
								right: { id: entity.entityId },
								mine: 'right',
							});
						}
					}
				}
			}

			for (const entity of protocolEntities) {
				const others = entity.relations.filter(rd => rd.type !== 'protocol');
				for (const relationEntry of others) {
					if (relationEntry.type === 'balance') {
						totalBalance += Number(relationEntry.balanceUsd);
						entries.push({
							left: { id: entity.entityId, symbol: relationEntry.symbol },
							leftValueUsd: Number(relationEntry.balanceUsd),
							right: null,
							mine: 'left',
						});
					} else if (relationEntry.type === 'balance-in-protocol') {
						if (!ignoreList.has(relationEntry.protocol + ':' + entity.entityId)) {
							totalProtocols += Number(relationEntry.balanceUsd);

							entries.push({
								left: { id: entity.entityId, symbol: relationEntry.symbol },
								leftValueUsd: Number(relationEntry.balanceUsd),
								right: { id: relationEntry.protocol },
								mine: 'left',
							});
						}
					}
				}
			}

			for (const entity of otherEntities) {
				for (const relationEntry of entity.relations) {
					if (relationEntry.type === 'balance') {
						totalBalance += Number(relationEntry.balanceUsd);
						entries.push({
							left: { id: entity.entityId, symbol: relationEntry.symbol },
							leftValueUsd: Number(relationEntry.balanceUsd),
							right: null,
							mine: 'left',
						});
					} else if (relationEntry.type === 'balance-in-protocol') {
						if (!ignoreList.has(relationEntry.protocol + ':' + entity.entityId)) {
							totalProtocols += Number(relationEntry.balanceUsd);
							entries.push({
								left: { id: entity.entityId, symbol: relationEntry.symbol },
								leftValueUsd: Number(relationEntry.balanceUsd),
								right: { id: relationEntry.protocol },
								mine: 'left',
							});
						}
					}
				}
			}

			return {
				total: totalBalance + totalProtocols,
				entries,
				totalBalance,
				totalProtocols,
			};
		});

		return {
			exposure: exposurePerPortfolioSource.reduce((acc, e) => acc + e.total, 0),
			exposurePercentage: 0,
			exposurePerPortfolioSource,
		};
	}

	static compute(
		portfolioSources: PortfolioSource[],
		portfolioSourceToAffectedProjectsMap: PortfolioSourceToAffectedProjectsMap,
	): ComputedPortfolio {
		const exposurePerPortfolioSource: Exposure[] = portfolioSources.map(ps => ({
			total: 0,
			totalBalance: 0,
			totalProtocols: 0,
		}));

		const projectToAffectedPortfolioSourcesMap = this.getProjectToAffectedPortfolioSourcesMap(
			portfolioSourceToAffectedProjectsMap,
		);
		const projectToRelatedEntitiesMap = this.getProjectToRelatedEntitiesMap(projectToAffectedPortfolioSourcesMap);

		const projectToPortfolioMetaMap: Record<string, ProjectPortfolioMeta> = {};

		for (const [projectId, relatedEntities] of Object.entries(projectToRelatedEntitiesMap)) {
			const isBalance = relatedEntities.some(r => r.relations.some(rd => rd.type === 'balance'));
			const isProtocolBalance = relatedEntities.some(r =>
				r.relations.some(rd => rd.type === 'balance-in-protocol'),
			);
			const isProtocol = relatedEntities.some(r => r.relations.some(rd => rd.type === 'protocol'));
			const isTransaction = relatedEntities.some(r => r.relations.some(rd => rd.type === 'transaction'));

			if (isBalance || isProtocolBalance || isProtocol) {
				const rawExposureData = this.calculateExposureToProject(portfolioSources, relatedEntities);
				projectToPortfolioMetaMap[projectId] = {
					relation: ProjectRelation.ACTIVE_EXPOSURE,
					exposure: rawExposureData,
				};
				rawExposureData.exposurePerPortfolioSource.forEach((e, i) => {
					exposurePerPortfolioSource[i].total += e.total;
					exposurePerPortfolioSource[i].totalBalance += e.totalBalance;
					exposurePerPortfolioSource[i].totalProtocols += e.totalProtocols;
				});
			} else if (isTransaction) {
				projectToPortfolioMetaMap[projectId] = {
					relation: ProjectRelation.INTERACTED,
					exposure: null,
				};
			}
		}

		// update exposure percentage:
		const totalExposure = exposurePerPortfolioSource.reduce((acc, e) => acc + e.total, 0);
		for (const [, meta] of Object.entries(projectToPortfolioMetaMap)) {
			if (meta.exposure) {
				meta.exposure.exposurePercentage = meta.exposure.exposure / totalExposure;
			}
		}

		return {
			totalExposure,
			exposurePerPortfolioSource,
			projectToPortfolioMetaMap,
		};
	}

	static cutoffCheck(
		cutoff: { type: 'value' | 'percent'; value: number },
		exposure: number,
		exposurePercentage: number,
	) {
		if (cutoff.type === 'value') {
			return exposure > cutoff.value;
		} else {
			return exposurePercentage > cutoff.value;
		}
	}

	static computeFilters(portfolio: ComputedPortfolio, cutoff: { type: 'value' | 'percent'; value: number }) {
		const activeProjectIds = new Set<number>();

		for (const [projectId, meta] of Object.entries(portfolio.projectToPortfolioMetaMap)) {
			if (meta.exposure) {
				if (this.cutoffCheck(cutoff, meta.exposure.exposure, meta.exposure.exposurePercentage)) {
					activeProjectIds.add(Number(projectId));
				}
			} else {
				activeProjectIds.add(Number(projectId));
			}
		}

		return [...activeProjectIds.values()];
	}

	static compileSourcesList(getSourceIdsByProjectId: (projectId: number) => number[], activeProjectIds: number[]) {
		const sourceIds = new Set<number>();

		for (const projectId of activeProjectIds) {
			const sourceIdsByProjectId = getSourceIdsByProjectId(projectId);
			for (const sourceId of sourceIdsByProjectId) {
				sourceIds.add(sourceId);
			}
		}

		return sourceIds;
	}

	static updateSourcesList(
		rawSourceIds: Set<number>,
		includedSourceIds: Set<number>,
		excludedSourceIds: Set<number>,
	) {
		const sourceIds = new Set<number>(rawSourceIds);

		for (const sourceId of includedSourceIds) {
			sourceIds.add(sourceId);
		}

		for (const sourceId of excludedSourceIds) {
			sourceIds.delete(sourceId);
		}

		return sourceIds;
	}

	static projectsSort(portfolio: ComputedPortfolio, feedSources: FeedSourcesScope<any, any>) {
		return (a: number, b: number) => {
			const aExposure = portfolio.projectToPortfolioMetaMap[a]?.exposure?.exposure || 0;
			const bExposure = portfolio.projectToPortfolioMetaMap[b]?.exposure?.exposure || 0;
			if (aExposure === bExposure) {
				const aName = feedSources.projectsMap.get(a)?.name || '';
				const bName = feedSources.projectsMap.get(b)?.name || '';
				return aName.localeCompare(bName);
			} else {
				return bExposure - aExposure;
			}
		};
	}

	static getProjectIds(portfolio: ComputedPortfolio, feedSources: FeedSourcesScope<any, any>) {
		const sort = this.projectsSort(portfolio, feedSources);
		return Object.keys(portfolio.projectToPortfolioMetaMap).map(Number).sort(sort);
	}
}
