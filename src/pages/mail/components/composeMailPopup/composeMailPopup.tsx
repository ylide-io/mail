import clsx from 'clsx';
import { observer } from 'mobx-react';
import React from 'react';
import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { OverlappingLoader } from '../../../../components/overlappingLoader/overlappingLoader';
import { Popup } from '../../../../components/popup/popup';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { ReactComponent as ExternalSvg } from '../../../../icons/ic20/external.svg';
import mailer from '../../../../stores/Mailer';
import { globalOutgoingMailData, OutgoingMailData } from '../../../../stores/outgoingMailData';
import { RoutePath } from '../../../../stores/routePath';
import { useNav } from '../../../../utils/url';
import { useOnMountAnimation } from '../../../../utils/useOnMountAnimation';
import { ComposeMailForm } from '../composeMailForm/composeMailForm';
import css from './composeMailPopup.module.scss';

export const COMPOSE_MAIL_POPUP_SINGLETON_KEY = 'COMPOSE_MAIL_POPUP';

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
