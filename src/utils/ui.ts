import { Rect } from './rect';

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

export function scrollIntoViewIfNeeded(elem: Element) {
	elem.scrollIntoView
		? elem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
		: // @ts-ignore
		  elem.scrollIntoViewIfNeeded && elem.scrollIntoViewIfNeeded();
}
