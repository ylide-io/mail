import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { ReactComponent as CrossSvg } from '../../icons/ic20/cross.svg';
import { ReactComponent as FoldSvg } from '../../icons/ic20/fold.svg';
import { alignAtViewportCenter } from '../../utils/alignment';
import { Overlay } from '../overlay/overlay';
import { Popup } from '../popup/popup';
import { PropsWithClassName } from '../props';
import { UiStackKey, useUiStack } from '../uiStack';
import css from './modal.module.scss';

export interface ModalProps extends PropsWithChildren<{}>, PropsWithClassName {
	isMinimized?: boolean;
	onMinimize?: () => void;

	closeOnOutsideClick?: boolean;
	onClose?: () => void;
}

export function Modal({ children, className, isMinimized, onMinimize, closeOnOutsideClick, onClose }: ModalProps) {
	const isFoldable = !!onMinimize;
	const uiStack = useUiStack(UiStackKey.MODAL);

	return (
		<>
			{uiStack.isFirst && <Overlay isHidden={isMinimized} onClick={() => closeOnOutsideClick && onClose?.()} />}

			{uiStack.isLast && (
				<Popup
					className={clsx(css.root, isMinimized && css.root_hidden)}
					align={alignAtViewportCenter}
					closeOnOutsideClick={closeOnOutsideClick}
					onClose={onClose}
				>
					<div className={clsx(css.body, className)}>{children}</div>

					<div className={css.controls}>
						{isFoldable && (
							<button className={css.button} title="Minimize" onClick={() => onMinimize()}>
								<FoldSvg />
							</button>
						)}

						{onClose && (
							<button className={css.button} title="Close" onClick={() => onClose()}>
								<CrossSvg />
							</button>
						)}
					</div>
				</Popup>
			)}
		</>
	);
}
