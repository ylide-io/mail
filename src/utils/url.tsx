import {
	createSearchParams,
	NavigateOptions,
	URLSearchParamsInit,
	useLocation,
	useMatch,
	useNavigate,
} from 'react-router-dom';

import { RoutePath } from '../stores/routePath';
import { filterObjectEntries } from './object';

export function toAbsoluteUrl(path: string) {
	return new URL(path, window.location.origin).href;
}

export function createCleanSerachParams(search: Record<string, any>) {
	return createSearchParams(filterObjectEntries(search, (_, value) => value != null));
}

//

interface UseNavParameters {
	path?: string;
	search?: URLSearchParamsInit;
	hash?: string;
}

export function buildUrl(params: string | UseNavParameters) {
	return typeof params === 'string'
		? params
		: `${params.path || ''}${params.search ? `?${createSearchParams(params.search).toString()}` : ''}${
				params.hash || ''
		  }`;
}

export interface NavOptions extends NavigateOptions {
	goBackIfPossible?: boolean;
}

export const useNav = () => {
	const navigate = useNavigate();
	const location = useLocation();

	return (value: string | UseNavParameters, options?: NavOptions) => {
		const newUrl = buildUrl(value);

		if (options?.goBackIfPossible) {
			const previousUrl = location.state?.previousUrl;

			if (previousUrl && previousUrl === newUrl) {
				history.back();
				return;
			}
		}

		navigate(newUrl, {
			...options,
			state: {
				previousUrl: buildUrl({
					path: location.pathname,
					search: location.search,
					hash: location.hash,
				}),
				...options?.state,
			},
		});
	};
};

export const usePreviousUrl = () => {
	return useLocation().state?.previousUrl;
};

//

export function useIsMatchesPattern(...routes: RoutePath[]) {
	return routes.map(useMatch).some(Boolean);
}
