// import { FeedProject, FeedReasonedProject, FeedSource } from '../api/feedServerApi';
// import { MainviewApi } from '../api/mainviewApi';

// export interface FeedProjectWithSources extends FeedProject {
// 	sources: FeedSource[];
// }

// export interface FeedProjectReason {
// 	portfolioSourceId: string;
// 	entityId: string;
// 	reasonsData: MainviewApi.ReasonDataEntry[];
// }

// export interface EnrichedFeedProject extends FeedProjectWithSources {
// 	reasons: FeedProjectReason[];
// 	group: ProjectRelationOrEmpty;
// 	exposureData: null | ReturnType<typeof calculateExposureToProject>;
// }

// export interface EnrichedPortfolioSource extends MainviewApi.PortfolioSource {
// 	projects: EnrichedFeedProject[];
// 	exposure: {
// 		total: number;
// 		totalBalance: number;
// 		totalProtocols: number;
// 	};
// }

// export const cutoffCheck = (
// 	cutoffType: 'value' | 'percent',
// 	cutoffValue: number,
// 	project: EnrichedFeedProject,
// 	totalPortfolio: number,
// ) => {
// 	if (cutoffType === 'value') {
// 		return (project.exposureData?.exposure || 0) > cutoffValue;
// 	} else {
// 		return (project.exposureData?.exposure || 0) / totalPortfolio > cutoffValue;
// 	}
// };

// export const calcReasons = (
// 	reasons: {
// 		portfolioSourceId: string;
// 		entityId: string;
// 		reasonsData: MainviewApi.ReasonDataEntry[];
// 	}[],
// 	type: 'balance' | 'balance-in-protocol',
// ) => {
// 	return reasons.reduce((acc2, r) => {
// 		return (
// 			acc2 +
// 			r.reasonsData.reduce((acc3, rd) => {
// 				if (rd.type === type) {
// 					return acc3 + Number(rd.balanceUsd);
// 				} else {
// 					return acc3;
// 				}
// 			}, 0)
// 		);
// 	}, 0);
// };

// export const calculateExposureToProject = (
// 	portfolioSources: MainviewApi.PortfolioSource[],
// 	reasons: FeedProjectReason[],
// ) => {
// 	const reasonsPerPortfolioSource = portfolioSources.map(ps => {
// 		return {
// 			source: ps,
// 			reasons: reasons.filter(r => r.portfolioSourceId === ps.id),
// 		};
// 	});

// 	const exposurePerPortfolioSource = reasonsPerPortfolioSource.map(({ source, reasons }) => {
// 		const protocolEntities = reasons.filter(r => r.reasonsData.some(rd => rd.type === 'protocol'));
// 		const otherEntities = reasons.filter(r => !r.reasonsData.some(rd => rd.type === 'protocol'));

// 		let balanceTotal = 0;
// 		let protocolsTotal = 0;
// 		let ignoreList = new Set<string>();

// 		const entries: {
// 			left: { id: string; symbol: string };
// 			leftValueUsd: number;
// 			right: { id: string } | null; // null for balance; symbol: string
// 			mine: 'left' | 'right';
// 		}[] = [];

// 		for (const reason of protocolEntities) {
// 			const protocols = reason.reasonsData.filter(rd => rd.type === 'protocol');
// 			for (const reasonEntry of protocols) {
// 				if (reasonEntry.type === 'protocol') {
// 					for (const token of reasonEntry.tokens) {
// 						protocolsTotal += Number(token.balanceUsd);
// 						ignoreList.add(reason.entityId + ':' + token.id); // arb:arb_curve:arb:0x123
// 						entries.push({
// 							left: { id: token.id, symbol: token.symbol },
// 							leftValueUsd: Number(token.balanceUsd),
// 							right: { id: reason.entityId },
// 							mine: 'right',
// 						});
// 					}
// 				}
// 			}
// 		}

// 		for (const reason of protocolEntities) {
// 			const others = reason.reasonsData.filter(rd => rd.type !== 'protocol');
// 			for (const reasonEntry of others) {
// 				if (reasonEntry.type === 'balance') {
// 					balanceTotal += Number(reasonEntry.balanceUsd);
// 					entries.push({
// 						left: { id: reason.entityId, symbol: reasonEntry.symbol },
// 						leftValueUsd: Number(reasonEntry.balanceUsd),
// 						right: null,
// 						mine: 'left',
// 					});
// 				} else if (reasonEntry.type === 'balance-in-protocol') {
// 					if (!ignoreList.has(reasonEntry.protocol + ':' + reason.entityId)) {
// 						protocolsTotal += Number(reasonEntry.balanceUsd);

// 						entries.push({
// 							left: { id: reason.entityId, symbol: reasonEntry.symbol },
// 							leftValueUsd: Number(reasonEntry.balanceUsd),
// 							right: { id: reasonEntry.protocol },
// 							mine: 'left',
// 						});
// 					}
// 				}
// 			}
// 		}

// 		for (const reason of otherEntities) {
// 			for (const reasonEntry of reason.reasonsData) {
// 				if (reasonEntry.type === 'balance') {
// 					balanceTotal += Number(reasonEntry.balanceUsd);
// 					entries.push({
// 						left: { id: reason.entityId, symbol: reasonEntry.symbol },
// 						leftValueUsd: Number(reasonEntry.balanceUsd),
// 						right: null,
// 						mine: 'left',
// 					});
// 				} else if (reasonEntry.type === 'balance-in-protocol') {
// 					if (!ignoreList.has(reasonEntry.protocol + ':' + reason.entityId)) {
// 						protocolsTotal += Number(reasonEntry.balanceUsd);
// 						entries.push({
// 							left: { id: reason.entityId, symbol: reasonEntry.symbol },
// 							leftValueUsd: Number(reasonEntry.balanceUsd),
// 							right: { id: reasonEntry.protocol },
// 							mine: 'left',
// 						});
// 					}
// 				}
// 			}
// 		}

// 		return {
// 			total: balanceTotal + protocolsTotal,
// 			entries,
// 			balanceTotal,
// 			protocolsTotal,
// 		};
// 	});

// 	return {
// 		exposure: exposurePerPortfolioSource.reduce((acc, e) => acc + e.total, 0),
// 		exposurePerPortfolioSource,
// 	};
// };

// export const preparePortfolioData = (
// 	feedSources: FeedSource[],
// 	portfolioSources: MainviewApi.PortfolioSource[],
// 	projectsByPortfolioSource: Record<string, FeedReasonedProject[]>,
// ) => {
// 	const projectsWithSourcesMap: Record<string, FeedProjectWithSources> = {};

// 	for (const s of feedSources) {
// 		const id = s.cryptoProject?.id || 'null';
// 		if (!projectsWithSourcesMap[id]) {
// 			projectsWithSourcesMap[id] = {
// 				id,
// 				name: s.cryptoProject?.name || 'Others',
// 				sources: [],
// 			};
// 		}
// 		projectsWithSourcesMap[id].sources.push(s);
// 	}

// 	const projectsWithSources = Object.values(projectsWithSourcesMap);

// 	const enrichedProjects: EnrichedFeedProject[] = [];
// 	const groups: Record<ProjectRelationOrEmpty, EnrichedFeedProject[]> = {
// 		'': [],
// 		[ProjectRelation.ACTIVE_EXPOSURE]: [],
// 		[ProjectRelation.INTERACTED]: [],
// 	};

// 	const exposurePerPortfolioSource = portfolioSources.map(ps => ({
// 		total: 0,
// 		totalBalance: 0,
// 		totalProtocols: 0,
// 	}));
// 	const enrichedProjectsByPortfolioSource: Record<string, EnrichedFeedProject[]> = {};

// 	const reverseMap: Record<
// 		string,
// 		{
// 			portfolioSourceId: string;
// 			reasons: {
// 				entityId: string; // debank/crypto entity id
// 				reasonsData: MainviewApi.ReasonDataEntry[];
// 			}[];
// 		}[]
// 	> = {};

// 	for (const [portfolioSourceId, projects] of Object.entries(projectsByPortfolioSource)) {
// 		for (const project of projects) {
// 			reverseMap[project.id] = reverseMap[project.id] || [];
// 			reverseMap[project.id].push({ portfolioSourceId, reasons: project.reasons });
// 		}
// 	}

// 	for (const projectWithSources of projectsWithSources) {
// 		const enrichedProjectLink = {};
// 		const reasons: FeedProjectReason[] = [];

// 		if (reverseMap[projectWithSources.id]) {
// 			const rm = reverseMap[projectWithSources.id];
// 			for (const { portfolioSourceId, reasons: inputReasons } of rm) {
// 				enrichedProjectsByPortfolioSource[portfolioSourceId] =
// 					enrichedProjectsByPortfolioSource[portfolioSourceId] || [];
// 				enrichedProjectsByPortfolioSource[portfolioSourceId].push(enrichedProjectLink as any);
// 				reasons.push(
// 					...inputReasons.map(r => ({
// 						portfolioSourceId,
// 						...r,
// 					})),
// 				);
// 			}
// 		}

// 		const isBalance = reasons.some(r => r.reasonsData.some(rd => rd.type === 'balance'));
// 		const isProtocolBalance = reasons.some(r => r.reasonsData.some(rd => rd.type === 'balance-in-protocol'));
// 		const isProtocol = reasons.some(r => r.reasonsData.some(rd => rd.type === 'protocol'));
// 		const isTransaction = reasons.some(r => r.reasonsData.some(rd => rd.type === 'transaction'));

// 		let exposureData = null;
// 		let group: ProjectRelationOrEmpty;
// 		if (isBalance || isProtocolBalance || isProtocol) {
// 			group = ProjectRelation.ACTIVE_EXPOSURE;
// 			const rawExposureData = calculateExposureToProject(portfolioSources, reasons);
// 			exposureData = rawExposureData;
// 			rawExposureData.exposurePerPortfolioSource.forEach((e, i) => {
// 				exposurePerPortfolioSource[i].total += e.total;
// 				exposurePerPortfolioSource[i].totalBalance += e.balanceTotal;
// 				exposurePerPortfolioSource[i].totalProtocols += e.protocolsTotal;
// 			});
// 		} else if (isTransaction) {
// 			group = ProjectRelation.INTERACTED;
// 		} else {
// 			group = '';
// 		}

// 		const enrichedProject = Object.assign(enrichedProjectLink, {
// 			...projectWithSources,
// 			reasons,
// 			group,
// 			exposureData,
// 		});

// 		enrichedProjects.push(enrichedProject);
// 	}

// 	const projects = enrichedProjects.sort((a, b) =>
// 		(a.exposureData?.exposure || 0) === (b.exposureData?.exposure || 0)
// 			? a.name.localeCompare(b.name)
// 			: (b.exposureData?.exposure || 0) - (a.exposureData?.exposure || 0),
// 	);
// 	for (const project of projects) {
// 		groups[project.group].push(project);
// 	}

// 	return {
// 		enrichedPortfolioSources: portfolioSources.map((ps, idx) => ({
// 			...ps,
// 			projects: enrichedProjectsByPortfolioSource[ps.id] || [],
// 			exposure: exposurePerPortfolioSource[idx],
// 		})),
// 		projects,
// 		groups,
// 	};
// };
