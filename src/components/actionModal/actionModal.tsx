import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { Modal } from '../modal/modal';
import css from './actionModal.module.scss';

export interface ActionModalProps extends PropsWithChildren<{}> {
	title?: ReactNode;
	buttons?: ReactNode;
	className?: string;
	onClose?: () => void;
}

export function ActionModal({ children, title, buttons, onClose, className }: ActionModalProps) {
	return (
		<Modal className={clsx([css.root, className])} onClose={onClose}>
			{title != null && <div className={css.title}>{title}</div>}

			{children != null && <div className={css.content}>{children}</div>}

			{buttons != null && <div className={css.buttons}>{buttons}</div>}
		</Modal>
	);
}
