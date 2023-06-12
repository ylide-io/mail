import { PropsWithChildren, ReactNode } from 'react';

import { Modal } from '../modal/modal';
import css from './actionModal.module.scss';

export interface ActionModalProps extends PropsWithChildren<{}> {
	title?: ReactNode;
	buttons?: ReactNode;
	onClose?: () => void;
}

export function ActionModal({ children, title, buttons, onClose }: ActionModalProps) {
	return (
		<Modal className={css.root} onClose={onClose}>
			{title != null && <div className={css.title}>{title}</div>}

			{children != null && <div className={css.content}>{children}</div>}

			{buttons != null && <div className={css.buttons}>{buttons}</div>}
		</Modal>
	);
}
