import { RefObject, useEffect } from 'react';

import { getElementParentOrSelf } from './ui';

export function useOutsideClick(
	rootRef: RefObject<Element>,
	outsideClickChecker?: (elem: HTMLElement) => boolean,
	callback?: () => void,
) {
	useEffect(() => {
		function onDocElemMouseDown(e: MouseEvent) {
			if (
				!getElementParentOrSelf(
					e.target as HTMLElement,
					elem => elem === rootRef.current || !!outsideClickChecker?.(elem),
				)
			) {
				callback?.();
			}
		}

		document.documentElement.addEventListener('mousedown', onDocElemMouseDown);

		return () => {
			document.documentElement.removeEventListener('mousedown', onDocElemMouseDown);
		};
	}, [rootRef, outsideClickChecker, callback]);
}
