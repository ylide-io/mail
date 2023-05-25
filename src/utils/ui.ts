import { RefObject, useCallback, useEffect, useState } from 'react';

import { Rect } from './rect';
import { useLatest } from './useLatest';

export function scrollWindowToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth',
	});
}

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

export function useIsInViewport(props: {
	ref: RefObject<Element>;
	threshold?: number;
	callback?: (visible: boolean) => void;
}) {
	const isInViewport = useCallback(() => {
		const rect = props.ref.current?.getBoundingClientRect();
		if (!rect) return false;

		const threshold = props.threshold || 0;
		return rect.bottom >= -threshold && rect.top <= document.documentElement.clientHeight + threshold;
	}, [props.ref, props.threshold]);

	const [visible, setVisible] = useState(() => isInViewport());

	useEffect(() => {
		const timer = setInterval(() => {
			setVisible(isInViewport());
		}, 300);

		return () => clearInterval(timer);
	}, [isInViewport]);

	const callbackRef = useLatest(props.callback);

	useEffect(() => {
		callbackRef.current?.(visible);
	}, [callbackRef, visible]);

	return visible;
}
