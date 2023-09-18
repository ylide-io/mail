import { RefObject, useEffect } from 'react';

import { Rect } from './rect';
import { useLatest } from './useLatest';

// SCROLL

export function scrollWindowToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth',
	});
}

export function scrollIntoViewIfNeeded(elem: Element) {
	elem.scrollIntoView
		? elem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
		: // @ts-ignore
		  elem.scrollIntoViewIfNeeded && elem.scrollIntoViewIfNeeded();
}

// BOUNDARIES

export function getViewportRect() {
	return new Rect(
		window.scrollX,
		window.scrollY,
		document.documentElement.clientWidth,
		document.documentElement.clientHeight,
	);
}

export function getElementRect(element: HTMLElement): Rect {
	const clientRect = element.getBoundingClientRect();

	return new Rect(clientRect.left, clientRect.top, clientRect.width, clientRect.height);
}

export function useOutsideMouseDown({
	rootRef,
	outsideClickChecker,
	callback,
}: {
	rootRef: RefObject<Element>;
	outsideClickChecker?: (elem: HTMLElement) => boolean;
	callback?: () => void;
}) {
	const outsideClickCheckerRef = useLatest(outsideClickChecker);
	const callbackRef = useLatest(callback);

	useEffect(() => {
		function onDocElemMouseDown(e: MouseEvent | TouchEvent) {
			if (
				!getElementParentOrSelf(
					e.target as HTMLElement,
					elem => elem === rootRef.current || !!outsideClickCheckerRef.current?.(elem),
				)
			) {
				callbackRef.current?.();
			}
		}

		document.documentElement.addEventListener('mousedown', onDocElemMouseDown);

		return () => {
			document.documentElement.removeEventListener('mousedown', onDocElemMouseDown);
		};
	}, [callbackRef, outsideClickCheckerRef, rootRef]);
}

// TREE

export function getElementParent(
	element: HTMLElement,
	predicate: (parent: HTMLElement) => boolean,
): HTMLElement | null {
	let parent: HTMLElement = element;
	while (parent.parentElement != null) {
		parent = parent.parentElement;
		if (predicate(parent)) {
			return parent;
		}
	}
	return null;
}

export function getElementParentOrSelf(
	element: HTMLElement,
	predicate: (parent: HTMLElement) => boolean,
): HTMLElement | null {
	return predicate(element) ? element : getElementParent(element, predicate);
}

// MUTATIONS

const MutationObserver = window.MutationObserver || (window as any)['WebKitMutationObserver'];

export function observeMutations(
	target: Node,
	callback: () => void,
	options: MutationObserverInit | undefined = {
		childList: true,
		subtree: true,
		attributes: true,
		characterData: true,
	},
) {
	const observer = new MutationObserver(() => callback());
	observer.observe(target, options);
	return () => observer.disconnect();
}
