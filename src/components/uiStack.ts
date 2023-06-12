import { autorun, observable } from 'mobx';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';

export enum UiStackKey {
	MODAL = 'MODAL',
}

const stack = observable(new Map<UiStackKey, string[]>());

export function useUiStack(key: UiStackKey) {
	const stackId = useMemo(() => nanoid(), []);
	const [isFirst, setFirst] = useState(true);
	const [isLast, setLast] = useState(true);

	useEffect(() => {
		stack.set(key, [...(stack.get(key) || []), stackId]);

		const detach = autorun(() => {
			const s = stack.get(key)!;
			setFirst(s[0] === stackId);
			setLast(s[s.length - 1] === stackId);
		});

		return () => {
			detach();

			stack.set(
				key,
				(stack.get(key) || []).filter(id => id !== stackId),
			);
		};
	}, [key, stackId]);

	return {
		isFirst,
		isLast,
	};
}
