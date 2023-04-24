import { PropsWithChildren, RefObject, useCallback } from 'react';

import {
	alignElementToAnchor,
	AlignmentDirection,
	defaultAnchoredElementAligner,
	DefaultAnchoredElementAlignerOptions,
	HorizontalAlignment,
	VerticalAlignment,
} from '../../../utils/alignment';
import { invariant } from '../../../utils/assert';
import { PropsWithClassName } from '../../props';
import { Popup } from '../popup';

interface PopupProps extends PropsWithChildren<{}>, PropsWithClassName {
	anchorRef: RefObject<HTMLElement>;
	horizontalAlign?: HorizontalAlignment;
	verticalAlign?: VerticalAlignment;
	alignmentDirection?: AlignmentDirection;
	alignerOptions?: DefaultAnchoredElementAlignerOptions;
	onCloseRequest?: () => void;
}

export function AnchoredPopup({
	children,
	className,
	anchorRef,
	horizontalAlign = HorizontalAlignment.START,
	verticalAlign = VerticalAlignment.END,
	alignmentDirection = AlignmentDirection.BOTTOM,
	alignerOptions,
	onCloseRequest,
}: PopupProps) {
	const alignPopup = useCallback(
		(popupElem: HTMLElement) => {
			invariant(anchorRef.current);

			alignElementToAnchor(
				popupElem,
				anchorRef.current,
				defaultAnchoredElementAligner(horizontalAlign, verticalAlign, alignmentDirection, alignerOptions),
			);
		},
		[alignmentDirection, alignerOptions, anchorRef, horizontalAlign, verticalAlign],
	);

	return (
		<Popup
			className={className}
			align={alignPopup}
			closeOnOutsideClick
			customOutsideClickChecker={elem => elem === anchorRef.current}
			onClose={onCloseRequest}
		>
			{children}
		</Popup>
	);
}
