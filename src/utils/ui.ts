import { Rect } from './rect';

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
