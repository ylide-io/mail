import { nanoid } from 'nanoid';
import { useEffect, useMemo } from 'react';

import { useHistoryState } from './history';
import { useLatest } from './useLatest';

const data: Record<string, any> = {};

export function usePreservedState<T>(factory: () => T): T | undefined {
	const historyState = useHistoryState();

	const id = useMemo(() => historyState.state.preservedStateId || nanoid(), [historyState]);

	useEffect(() => {
		if (historyState.state.preservedStateId !== id) {
			historyState.patchState({ preservedStateId: id });
		}
	}, [historyState, id]);

	const factoryRef = useLatest(factory);

	useEffect(() => {
		return () => {
			// eslint-disable-next-line react-hooks/exhaustive-deps
			data[id] = factoryRef.current();
		};
	}, [factoryRef, id]);

	return data[id];
}
