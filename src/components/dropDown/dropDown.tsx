import clsx from 'clsx';
import { PropsWithChildren, RefObject } from 'react';

import {
	AlignmentDirection,
	DefaultAnchoredElementAlignerOptions,
	HorizontalAlignment,
	VerticalAlignment,
} from '../../utils/alignment';
import { AnchoredPopup } from '../popup/anchoredPopup/anchoredPopup';
import { PropsWithClassName } from '../propsWithClassName';
import css from './dropDown.module.scss';

const alignerOptions: DefaultAnchoredElementAlignerOptions = {
	fitTopToViewport: true,
	fitLeftToViewport: true,
	fitHeightToViewport: true,
	fitWidthToViewport: true,
};

export interface DropDownProps extends PropsWithChildren, PropsWithClassName {
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
			<div className={css.content}>{children}</div>
		</AnchoredPopup>
	);
}

export enum DropDownItemMode {
	REGULAR = 'REGULAR',
	SELECTED = 'SELECTED',
	DISABLED = 'DISABLED',
}

interface DropDownItemProps extends PropsWithChildren {
	mode?: DropDownItemMode;
	onSelect?: () => void;
}

export function DropDownItem({ children, mode = DropDownItemMode.REGULAR, onSelect }: DropDownItemProps) {
	return (
		<div
			className={clsx(
				css.item,
				{
					[DropDownItemMode.REGULAR]: css.item_regular,
					[DropDownItemMode.SELECTED]: css.item_selected,
					[DropDownItemMode.DISABLED]: css.item_disabled,
				}[mode || DropDownItemMode.REGULAR],
			)}
			onClick={() => {
				if (mode === DropDownItemMode.REGULAR) {
					onSelect?.();
				}
			}}
		>
			{children}
		</div>
	);
}
