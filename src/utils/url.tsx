import { createSearchParams, NavigateOptions, URLSearchParamsInit, useNavigate } from 'react-router-dom';

import { filterObjectEntries } from './object';

export function toAbsoluteUrl(path: string) {
	return new URL(path, window.location.origin).href;
}

export function createCleanSerachParams(search: Record<string, any>) {
	return createSearchParams(filterObjectEntries(search, (key, value) => value != null));
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
		: `${params.path}${params.search ? `?${createSearchParams(params.search).toString()}` : ''}${
				params.hash ? `#${params.hash}` : ''
		  }`;
}

export const useNav = () => {
	const navigate = useNavigate();

	return (value: string | UseNavParameters, options?: NavigateOptions) => {
		const params: UseNavParameters = typeof value === 'string' ? { path: value } : value;

		navigate(buildUrl(params), options);
	};
};
