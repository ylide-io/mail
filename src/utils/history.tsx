import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { useNav } from './url';

export type HistoryState = Partial<{
	preservedStateKey: string;
}>;

export function useHistoryState() {
	const location = useLocation();
	const navigate = useNav();

	const state: HistoryState = useMemo(() => location.state || {}, [location.state]);

	const setState = useCallback(
		(state: HistoryState) => {
			navigate(
				{ path: location.pathname, search: location.search, hash: location.hash },
				{ state, replace: true },
			);
		},
		[location.hash, location.pathname, location.search, navigate],
	);

	const patchState = useCallback(
		(patch: Partial<HistoryState>) => {
			setState({ ...state, ...patch });
		},
		[setState, state],
	);

	return useMemo(
		() => ({
			state,
			setState,
			patchState,
		}),
		[patchState, setState, state],
	);
}
