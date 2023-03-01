import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { ReactComponent as CrossSvg } from '../../icons/ic20/cross.svg';
import { ReactComponent as ExternalSvg } from '../../icons/ic20/external.svg';
import { ReactComponent as FoldSvg } from '../../icons/ic20/fold.svg';
import { alignAtViewportBottom, alignAtViewportCenter } from '../../utils/alignment';
import { Overlay } from '../overlay/overlay';
import { Popup } from '../popup/popup';
import { PropsWithClassName } from '../propsWithClassName';
import css from './modal.module.scss';

export interface ModalProps extends PropsWithChildren, PropsWithClassName {
	foldedTitle?: ReactNode;
	isFolded?: boolean;
	onFold?: (isFolded: boolean) => void;

	closeOnOutsideClick?: boolean;
	onClose?: () => void;
}

export function Modal({
	children,
	className,
	closeOnOutsideClick,
	foldedTitle,
	isFolded,
	onFold,
	onClose,
}: ModalProps) {
	const isFoldable = !!onFold;

	return (
		<>
			<Overlay isHidden={isFolded} onClick={() => closeOnOutsideClick && onClose?.()} />

			<Popup
				className={clsx(css.root, isFolded && css.root_folded)}
				align={alignAtViewportCenter}
				closeOnOutsideClick={closeOnOutsideClick}
				onClose={onClose}
			>
				<div className={clsx(css.body, className)}>{children}</div>

				<div className={css.controls}>
					{isFoldable && (
						<button className={css.button} title="Minimize" onClick={() => onFold(true)}>
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

			{isFolded && (
				<Popup className={css.folded} align={alignAtViewportBottom} onClick={() => onFold?.(false)}>
					<div>{foldedTitle || 'Click to restore'}</div>

					<ExternalSvg />
				</Popup>
			)}
		</>
	);
}
