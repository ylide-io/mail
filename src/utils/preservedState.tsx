import { nanoid } from 'nanoid';
import { useEffect, useMemo } from 'react';

import { useHistoryState } from './history';
import { useLatest } from './useLatest';

const data: Record<string, any> = {};

interface UsePreservedStateParams<T> {
	/**
	 * Will be called on page unmounting.
	 * Should return data that will be restored if user would return to this page again.
	 */
	factory: () => T;

	/**
	 * Will be called before restoring state on page mounting.
	 * If return 'false', then state won't be restored, and the hook will return 'undefined'.
	 */
	validate?: (state: T) => boolean;
}

export function usePreservedState<T>(params: UsePreservedStateParams<T>): T | undefined {
	const historyState = useHistoryState();

	const id = useMemo(() => historyState.state.preservedStateId || nanoid(), [historyState]);

	useEffect(() => {
		if (historyState.state.preservedStateId !== id) {
			historyState.patchState({ preservedStateId: id });
		}
	}, [historyState, id]);

	const factoryRef = useLatest(params.factory);

	useEffect(() => {
		return () => {
			// eslint-disable-next-line react-hooks/exhaustive-deps
			data[id] = factoryRef.current();
		};
	}, [factoryRef, id]);

	if (params.validate && data.hasOwnProperty(id) && !params.validate(data[id])) {
		delete data[id];
	}

	return data[id];
}
