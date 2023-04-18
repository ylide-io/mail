import { ReactNode } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { Modal } from '../modal/modal';
import css from './actionModal.module.scss';

export interface ActionModalButton {
	title: ReactNode;
	look?: ActionButtonLook;
	onClick: () => void;
}

export interface ActionModalProps {
	title?: ReactNode;
	description?: ReactNode;
	buttons?: ActionModalButton[];
	onClose?: () => void;
}

export function ActionModal({ title, description, buttons, onClose }: ActionModalProps) {
	return (
		<Modal className={css.root} onClose={onClose}>
			{title != null && <div className={css.title}>{title}</div>}

			{description != null && <div className={css.description}>{description}</div>}

			{!!buttons?.length && (
				<div className={css.buttons}>
					{buttons.map(button => (
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={button.look}
							onClick={() => button.onClick()}
						>
							{button.title}
						</ActionButton>
					))}
				</div>
			)}
		</Modal>
	);
}
