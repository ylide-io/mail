import { nanoid } from 'nanoid';
import { useEffect, useLayoutEffect, useMemo } from 'react';

import { useHistoryState } from './history';
import { useLatest } from './useLatest';

const KEY_SEPARATOR = '|@|';

const data: Record<string, any> = {};

interface UsePreservedStateParams<T> {
	key?: string[];

	/**
	 * Will be called on page unmounting.
	 * Should return data that will be restored if user would return to this page again.
	 */
	factory: () => T | undefined;

	/**
	 * Will be called before restoring state on page mounting.
	 * If return 'false', then state won't be restored, and the hook will return 'undefined'.
	 */
	validate?: (state: T) => boolean;
}

export function usePreservedState<T>(params: UsePreservedStateParams<T>): T | undefined {
	const historyState = useHistoryState();

	const key = useMemo(
		() => params.key?.join(KEY_SEPARATOR) || historyState.state.preservedStateKey || nanoid(),
		[historyState.state.preservedStateKey, params.key],
	);

	useEffect(() => {
		if (historyState.state.preservedStateKey !== key) {
			historyState.patchState({ preservedStateKey: key });
		}
	}, [historyState, key]);

	const factoryRef = useLatest(params.factory);

	useLayoutEffect(() => {
		return () => {
			// eslint-disable-next-line react-hooks/exhaustive-deps
			data[key] = factoryRef.current();
		};
	}, [factoryRef, key]);

	if (params.validate && data[key] !== undefined && !params.validate(data[key])) {
		delete data[key];
	}

	return data[key];
}
