import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { useNav } from './url';

export type HistoryState = Partial<{
	preservedStateId: string;
}>;

export function useHistoryState() {
	const location = useLocation();
	const navigate = useNav();

	const state: HistoryState = useMemo(() => location.state || {}, [location.state]);

	const setState = useCallback(
		(state: HistoryState) => {
			navigate('', { state, replace: true });
		},
		[navigate],
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
