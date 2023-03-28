import clsx from 'clsx';
import { PropsWithChildren, RefObject, useEffect, useRef } from 'react';

import {
	AlignmentDirection,
	DefaultAnchoredElementAlignerOptions,
	HorizontalAlignment,
	VerticalAlignment,
} from '../../utils/alignment';
import { scrollIntoViewIfNeeded } from '../../utils/ui';
import { AnchoredPopup } from '../popup/anchoredPopup/anchoredPopup';
import { PropsWithClassName } from '../propsWithClassName';
import css from './dropDown.module.scss';

const alignerOptions: DefaultAnchoredElementAlignerOptions = {
	fitTopToViewport: false,
	fitLeftToViewport: true,
	fitHeightToViewport: true,
	fitWidthToViewport: true,
};

export interface DropDownProps extends PropsWithChildren<{}>, PropsWithClassName {
	anchorRef: RefObject<HTMLElement>;
	horizontalAlign?: HorizontalAlignment;
	verticalAlign?: VerticalAlignment;
	alignmentDirection?: AlignmentDirection;
	onCloseRequest?: () => void;
}

export function DropDown({
	children,
	className,
	anchorRef,
	horizontalAlign,
	verticalAlign,
	alignmentDirection,
	onCloseRequest,
}: DropDownProps) {
	return (
		<AnchoredPopup
			anchorRef={anchorRef}
			className={clsx(css.root, className)}
			horizontalAlign={horizontalAlign}
			verticalAlign={verticalAlign}
			alignmentDirection={alignmentDirection}
			alignerOptions={alignerOptions}
			onCloseRequest={onCloseRequest}
		>
			<div className={css.content} onMouseDown={e => e.preventDefault()}>
				{children}
			</div>
		</AnchoredPopup>
	);
}

export enum DropDownItemMode {
	REGULAR = 'REGULAR',
	HIGHLIGHTED = 'HIGHLIGHTED',
	SELECTED = 'SELECTED',
	DISABLED = 'DISABLED',
	WRAPPER = 'WRAPPER',
}

interface DropDownItemProps extends PropsWithChildren<{}> {
	mode?: DropDownItemMode;
	onSelect?: () => void;
}

export function DropDownItem({ children, mode = DropDownItemMode.REGULAR, onSelect }: DropDownItemProps) {
	const itemRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (itemRef.current && mode === DropDownItemMode.HIGHLIGHTED) {
			scrollIntoViewIfNeeded(itemRef.current);
		}
	}, [mode]);

	return (
		<div
			ref={itemRef}
			className={clsx(
				css.item,
				{
					[DropDownItemMode.REGULAR]: css.item_regular,
					[DropDownItemMode.HIGHLIGHTED]: css.item_highlighted,
					[DropDownItemMode.SELECTED]: css.item_selected,
					[DropDownItemMode.DISABLED]: css.item_disabled,
					[DropDownItemMode.WRAPPER]: css.item_wrapper,
				}[mode || DropDownItemMode.REGULAR],
			)}
			onClick={() => {
				if (mode !== DropDownItemMode.DISABLED) {
					onSelect?.();
				}
			}}
		>
			{children}
		</div>
	);
}
