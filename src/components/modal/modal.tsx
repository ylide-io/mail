import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { ReactComponent as CrossSvg } from '../../icons/cross.svg';
import { alignAtViewportCenter } from '../../utils/alignment';
import { Overlay } from '../overlay/overlay';
import { Popup } from '../popup/popup';
import { PropsWithClassName } from '../propsWithClassName';
import css from './modal.module.scss';

export interface ModalProps extends PropsWithChildren, PropsWithClassName {
	onClose?: () => void;
}

export function Modal({ children, className, onClose }: ModalProps) {
	return (
		<>
			<Overlay onClick={onClose} />

			<Popup className={css.root} align={alignAtViewportCenter} onCloseRequest={onClose}>
				<div className={clsx(css.body, className)}>{children}</div>

				{onClose && (
					<button className={css.closeButton} onClick={() => onClose()}>
						<CrossSvg />
					</button>
				)}
			</Popup>
		</>
	);
}
