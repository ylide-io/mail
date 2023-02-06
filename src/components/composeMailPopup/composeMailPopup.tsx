import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { ReactNode } from 'react';

import { ReactComponent as CrossSvg } from '../../icons/cross.svg';
import mailer from '../../stores/Mailer';
import { OutgoingMailData } from '../../stores/outgoingMailData';
import { useOnMountAnimation } from '../../utils/useOnMountAnimation';
import { ComposeMailForm } from '../composeMailForm/composeMailForm';
import { OverlappingLoader } from '../overlappingLoader/overlappingLoader';
import { Popup } from '../popup/popup';
import { useStaticComponentManager } from '../staticComponentManager/staticComponentManager';
import css from './composeMailPopup.module.scss';

let currentPopup: ReactNode = undefined;

export function useComposeMailPopup() {
	const staticComponentManager = useStaticComponentManager();

	return (props: ComposeMailPopupProps) => {
		if (currentPopup) {
			staticComponentManager.remove(currentPopup);
		}

		const newPopup = (
			<ComposeMailPopup
				key={Date.now()}
				{...props}
				onClose={() => {
					staticComponentManager.remove(newPopup);
					props.onClose?.();
				}}
			/>
		);

		currentPopup = newPopup;
		staticComponentManager.attach(newPopup);
	};
}

//

export interface ComposeMailPopupProps {
	mailData: OutgoingMailData;
	onClose?: () => void;
}

export const ComposeMailPopup = observer(({ onClose, mailData }: ComposeMailPopupProps) => {
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

			{mailer.sending && <OverlappingLoader text="Broadcasting your message to blockchain..." />}
		</Popup>
	);
});
