import { constrain } from './number';
import { Rect } from './rect';
import { getElementRect, getViewportRect } from './ui';

export enum VerticalAlignment {
	START = 'START',
	MIDDLE = 'MIDDLE',
	END = 'END',
}

export enum HorizontalAlignment {
	START = 'START',
	MIDDLE = 'MIDDLE',
	END = 'END',
	MATCH = 'MATCH',
}

export enum AlignmentDirection {
	TOP = 'TOP',
	BOTTOM = 'BOTTOM',
}

export type Aligner = (anchorRect: Rect, elementRect: Rect) => Rect;

export interface DefaultAnchoredElementAlignerOptions {
	fitLeftToViewport?: boolean;
	fitTopToViewport?: boolean;
	fitWidthToViewport?: boolean;
	fitHeightToViewport?: boolean;
}

export function defaultAnchoredElementAligner(
	horizontalAlignment: HorizontalAlignment,
	verticalAlignment: VerticalAlignment,
	alignmentDirection: AlignmentDirection,
	options: DefaultAnchoredElementAlignerOptions = {},
): Aligner {
	return (anchorRect, elementRect) => {
		const rect = elementRect.clone();

		switch (horizontalAlignment) {
			case HorizontalAlignment.START:
				rect.x = anchorRect.x;
				break;

			case HorizontalAlignment.MIDDLE:
				rect.x = anchorRect.centerX - rect.width / 2;
				break;

			case HorizontalAlignment.END:
				rect.x = anchorRect.right - rect.width;
				break;

			case HorizontalAlignment.MATCH:
				rect.x = anchorRect.x;
				rect.width = anchorRect.width;
				break;
		}

		switch (verticalAlignment) {
			case VerticalAlignment.START:
				rect.y = alignmentDirection === AlignmentDirection.BOTTOM ? anchorRect.y : anchorRect.y - rect.height;
				break;

			case VerticalAlignment.MIDDLE:
				rect.y = anchorRect.centerY - rect.height / 2;
				break;

			case VerticalAlignment.END:
				rect.y =
					alignmentDirection === AlignmentDirection.BOTTOM ? anchorRect.bottom : anchorRect.y - rect.height;
				break;
		}

		const viewportRect = getViewportRect();

		if (options.fitLeftToViewport) {
			rect.x = constrain(rect.x, 0, constrain(viewportRect.width - rect.width, 0));
		}

		if (options.fitTopToViewport) {
			rect.y = constrain(rect.y, 0, constrain(viewportRect.height - rect.height, 0));
		}

		if (options.fitWidthToViewport) {
			rect.width = constrain(rect.width, null, viewportRect.width - rect.x);
		}

		if (options.fitHeightToViewport) {
			rect.height = constrain(rect.height, null, viewportRect.height - rect.y);
		}

		return rect;
	};
}

export function alignElementToAnchor(element: HTMLElement, anchorElement: HTMLElement, alignment: Aligner) {
	Object.assign(element.style, {
		top: null,
		left: null,
		width: null,
		height: null,
	});

	const anchorRect = getElementRect(anchorElement);
	const initialElementRect = getElementRect(element);
	const targetElementRect = alignment(anchorRect, initialElementRect);

	Object.assign(element.style, {
		top: `${targetElementRect.y}px`,
		left: `${targetElementRect.x}px`,
		width: initialElementRect.width !== targetElementRect.width ? `${targetElementRect.width}px` : null,
		height: initialElementRect.height !== targetElementRect.height ? `${targetElementRect.height}px` : null,
	});

	return {
		anchorRect,
		initialElementRect,
		targetElementRect,
	};
}

export function alignAtViewportCenter(element: HTMLElement) {
	const elemRect = element.getBoundingClientRect();

	element.style.left = `${constrain(document.documentElement.clientWidth / 2 - elemRect.width / 2, 0)}px`;

	element.style.top = `${constrain(document.documentElement.clientHeight / 2.75 - elemRect.height / 2.75, 0)}px`;
}
