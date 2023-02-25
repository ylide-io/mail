import { observer } from 'mobx-react';
import React, { useEffect } from 'react';
import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonLook } from '../../components/ActionButton/ActionButton';
import { ComposeMailForm } from '../../components/composeMailForm/composeMailForm';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { OverlappingLoader } from '../../components/overlappingLoader/overlappingLoader';
import { ReactComponent as CrossSvg } from '../../icons/ic20/cross.svg';
import { analytics } from '../../stores/Analytics';
import mailer from '../../stores/Mailer';
import { useMailStore } from '../../stores/MailList';
import { globalOutgoingMailData } from '../../stores/outgoingMailData';
import { RoutePath } from '../../stores/routePath';
import { useNav } from '../../utils/navigate';
import css from './ComposePage.module.scss';

export const ComposePage = observer(() => {
	const navigate = useNav();
	const lastActiveFolderId = useMailStore(state => state.lastActiveFolderId);

	useEffect(() => {
		analytics.composeOpened();
	}, []);

	useEffect(() => () => globalOutgoingMailData.reset(), []);

	return (
		<GenericLayout>
			<div className={css.header}>
				<div className={css.headerTitle}>Compose mail</div>

				<div className={css.headerActions}>
					<ActionButton
						look={ActionButtonLook.DENGEROUS}
						onClick={() => {
							navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: lastActiveFolderId }));
						}}
						icon={<CrossSvg />}
					>
						Discard
					</ActionButton>
				</div>
			</div>

			<ComposeMailForm
				className={css.form}
				mailData={globalOutgoingMailData}
				onSent={() => navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: lastActiveFolderId }))}
			/>

			{mailer.sending && <OverlappingLoader text="Broadcasting your message to blockchain..." />}
		</GenericLayout>
	);
});
