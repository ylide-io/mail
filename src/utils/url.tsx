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

export function isExternalUrl(url: string) {
	const a = document.createElement('a');
	a.href = url;
	return a.host !== location.host;
}

//

export interface UseNavParameters {
	path?: string;
	search?: URLSearchParamsInit;
	hash?: string;
}

export function buildUrl(params: string | UseNavParameters) {
	return typeof params === 'string'
		? params
		: `${params.path || ''}${params.search ? `?${createSearchParams(params.search).toString()}` : ''}${
				params.hash ? `#${params.hash}` : ''
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

//

export function useIsMatchesPattern(...routes: RoutePath[]) {
	const location = useLocation();
	return routes.some(route => matchPath(route, location.pathname));
}

export function useIsMatchesPath(...paths: string[]) {
	const location = useLocation();
	return paths.includes(location.pathname);
}
