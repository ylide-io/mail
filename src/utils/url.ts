import { createSearchParams } from 'react-router-dom';

import { filterObjectEntries } from './object';

export function createCleanSerachParams(search: Record<string, any>) {
	return createSearchParams(filterObjectEntries(search, (key, value) => value != null));
}
