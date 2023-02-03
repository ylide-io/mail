import clsx from 'clsx';
import React from 'react';

import { ReactComponent as CrossSvg } from '../../icons/cross.svg';
import { OutgoingMailData } from '../../stores/outgoingMailData';
import { useOnMountAnimation } from '../../utils/useOnMountAnimation';
import { ComposeMailForm } from '../composeMailForm/composeMailForm';
import { Popup } from '../popup/popup';
import { useStaticComponentManager } from '../staticComponentManager/staticComponentManager';
import css from './composeMailPopup.module.scss';

export interface ComposeMailPopupProps {
	mailData: OutgoingMailData;
	onClose?: () => void;
}

export function useComposeMailPopup() {
	const staticComponentManager = useStaticComponentManager();

	return (props: ComposeMailPopupProps) =>
		staticComponentManager.show(onRemove => (
			<ComposeMailPopup
				{...props}
				onClose={() => {
					onRemove();
					props.onClose?.();
				}}
			/>
		));
}

export function ComposeMailPopup({ onClose, mailData }: ComposeMailPopupProps) {
	const isMount = useOnMountAnimation();

	return (
		<Popup
			className={clsx(css.root, isMount && css.root_visible)}
			outsideClickChecker={() => true}
			onCloseRequest={onClose}
		>
			<div className={css.header}>
				New message
				<button className={css.headerButton} onClick={() => onClose?.()}>
					<CrossSvg />
				</button>
			</div>

			<ComposeMailForm className={css.form} mailData={mailData} />
		</Popup>
	);
}
