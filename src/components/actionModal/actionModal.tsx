import { ReactNode } from 'react';

import { Modal } from '../modal/modal';
import css from './actionModal.module.scss';

export interface ActionModalProps {
	title?: ReactNode;
	description?: ReactNode;
	buttons?: ReactNode;
	onClose?: () => void;
}

export function ActionModal({ title, description, buttons, onClose }: ActionModalProps) {
	return (
		<Modal className={css.root} onClose={onClose}>
			{title != null && <div className={css.title}>{title}</div>}

			{description != null && <div className={css.description}>{description}</div>}

			{buttons != null && <div className={css.buttons}>{buttons}</div>}
		</Modal>
	);
}
