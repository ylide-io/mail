import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { ReactNode } from 'react';
import { generatePath } from 'react-router-dom';

import { ReactComponent as CrossSvg } from '../../icons/ic20/cross.svg';
import { ReactComponent as ExternalSvg } from '../../icons/ic20/external.svg';
import mailer from '../../stores/Mailer';
import { globalOutgoingMailData, OutgoingMailData } from '../../stores/outgoingMailData';
import { RoutePath } from '../../stores/routePath';
import { useNav } from '../../utils/navigate';
import { useOnMountAnimation } from '../../utils/useOnMountAnimation';
import { ActionButton, ActionButtonLook } from '../ActionButton/ActionButton';
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
	const navigate = useNav();
	const isMount = useOnMountAnimation();

	return (
		<Popup className={clsx(css.root, isMount && css.root_visible)} onClose={onClose}>
			<div className={css.header}>
				New message
				<div className={css.headerActions}>
					<ActionButton
						look={ActionButtonLook.LITE}
						icon={<ExternalSvg />}
						title="Open full editor"
						onClick={() => {
							onClose?.();

							globalOutgoingMailData.reset(mailData);
							navigate(generatePath(RoutePath.MAIL_COMPOSE));
						}}
					/>

					<ActionButton
						look={ActionButtonLook.LITE}
						icon={<CrossSvg />}
						title="Close"
						onClick={() => onClose?.()}
					/>
				</div>
			</div>

			<ComposeMailForm className={css.form} mailData={mailData} onSent={onClose} />

			{mailer.sending && <OverlappingLoader text="Broadcasting your message to blockchain..." />}
		</Popup>
	);
});
