import clsx from 'clsx';
import { CSSProperties, PropsWithChildren, RefObject, useEffect, useRef } from 'react';

import {
	AlignmentDirection,
	DefaultAnchoredElementAlignerOptions,
	HorizontalAlignment,
	VerticalAlignment,
} from '../../utils/alignment';
import { scrollIntoViewIfNeeded } from '../../utils/ui';
import { AnchoredPopup } from '../popup/anchoredPopup/anchoredPopup';
import { PropsWithClassName } from '../props';
import css from './dropDown.module.scss';

const alignerOptions: DefaultAnchoredElementAlignerOptions = {
	fitTopToViewport: false,
	fitLeftToViewport: true,
	fitHeightToViewport: true,
	fitWidthToViewport: true,
};

export interface DropDownProps extends PropsWithChildren<{}>, PropsWithClassName {
	innerClassName?: string;
	contentClassName?: string;
	anchorRef: RefObject<HTMLElement>;
	horizontalAlign?: HorizontalAlignment;
	verticalAlign?: VerticalAlignment;
	alignmentDirection?: AlignmentDirection;
	onCloseRequest?: () => void;
}

export function DropDown({
	children,
	className,
	innerClassName,
	contentClassName,
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
			<div className={clsx(css.inner, innerClassName)}>
				<div className={clsx(css.content, contentClassName)} onMouseDown={e => e.preventDefault()}>
					{children}
				</div>
			</div>
		</AnchoredPopup>
	);
}

export enum DropDownItemMode {
	REGULAR = 'REGULAR',
	LITE = 'LITE',
	HIGHLIGHTED = 'HIGHLIGHTED',
	SELECTED = 'SELECTED',
	DISABLED = 'DISABLED',
	WRAPPER = 'WRAPPER',
}

interface DropDownItemProps extends PropsWithChildren<{}>, PropsWithClassName {
	mode?: DropDownItemMode;
	style?: CSSProperties;
	onSelect?: () => void;
}

export function DropDownItem({
	children,
	className,
	mode = DropDownItemMode.REGULAR,
	style,
	onSelect,
}: DropDownItemProps) {
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
					[DropDownItemMode.LITE]: css.item_lite,
					[DropDownItemMode.HIGHLIGHTED]: css.item_highlighted,
					[DropDownItemMode.SELECTED]: css.item_selected,
					[DropDownItemMode.DISABLED]: css.item_disabled,
					[DropDownItemMode.WRAPPER]: css.item_wrapper,
				}[mode || DropDownItemMode.REGULAR],
				className,
			)}
			style={style}
			onClick={() => {
				if (mode !== DropDownItemMode.DISABLED) {
					onSelect?.();
				}
			}}
		>
			<div className={css.itemContent}>{children}</div>
		</div>
	);
}
