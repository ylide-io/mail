import { FeedManagerApi } from '../api/feedManagerApi';
import { FeedSource } from '../api/feedServerApi';

export function getSelectedSourceIds(sources: FeedSource[], configResponse: FeedManagerApi.GetConfigResponse) {
	const defaultProjectIds = configResponse.defaultProjects.map(p => p.projectId);

	return sources
		.filter(s =>
			s.cryptoProject?.id && defaultProjectIds.includes(s.cryptoProject.id)
				? !configResponse.config.excludedProjectIds.includes(s.id)
				: configResponse.config.includedProjectIds.includes(s.id),
		)
		.map(s => s.id);
}

export async function updateFeedConfig(
	token: string,
	selectedSourceIds: string[],
	sources: FeedSource[],
	configResponse: FeedManagerApi.GetConfigResponse,
) {
	const defaultProjectIds = configResponse.defaultProjects.map(p => p.projectId);

	const excludedProjectIds = sources
		.filter(
			s =>
				!selectedSourceIds.includes(s.id) &&
				(!s.cryptoProject?.id || defaultProjectIds.includes(s.cryptoProject.id)),
		)
		.map(s => s.id);

	const includedProjectIds = sources
		.filter(
			s =>
				selectedSourceIds.includes(s.id) &&
				s.cryptoProject?.id &&
				!defaultProjectIds.includes(s.cryptoProject.id),
		)
		.map(s => s.id);

	await FeedManagerApi.setConfig({
		token,
		config: {
			mode: configResponse.config.mode,
			excludedProjectIds,
			includedProjectIds,
		},
	});
}
