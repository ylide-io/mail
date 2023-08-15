import {
	createSearchParams,
	matchPath,
	NavigateOptions,
	URLSearchParamsInit,
	useLocation,
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

export function beautifyUrl(url: string) {
	const u = new URL(url);

	const host = u.hostname.replace(/^www\./, '');
	const search = u.search;
	const hash = u.hash;
	const path = u.pathname.length > 1 || (!search && !hash) ? u.pathname.replace(/\/$/, '') : u.pathname;

	return `${host}${path}${search}${hash}`;
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

export const useNav = () => {
	const navigate = useNavigate();

	return (value: string | UseNavParameters, options?: NavigateOptions) => {
		if (!options?.preventScrollReset) {
			window.scrollTo(0, 0);
		}

		navigate(buildUrl(value), options);
	};
};

//

export function useIsMatchesPattern(...routes: RoutePath[]) {
	const location = useLocation();
	return routes.some(route => matchPath(route, location.pathname));
}

export function useIsMatchesPath(...paths: string[]) {
	const location = useLocation();
	return paths.includes(location.pathname);
}
