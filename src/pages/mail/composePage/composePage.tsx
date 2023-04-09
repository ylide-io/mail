import { observer } from 'mobx-react';
import React, { useEffect } from 'react';
import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonLook } from '../../../components/ActionButton/ActionButton';
import { FullPageContent } from '../../../components/genericLayout/content/fullPageContent/fullPageContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { OverlappingLoader } from '../../../components/overlappingLoader/overlappingLoader';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { analytics } from '../../../stores/Analytics';
import mailer from '../../../stores/Mailer';
import { mailStore } from '../../../stores/MailList';
import { globalOutgoingMailData } from '../../../stores/outgoingMailData';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { ComposeMailForm } from '../components/composeMailForm/composeMailForm';
import css from './composePage.module.scss';

export const ComposePage = observer(() => {
	const navigate = useNav();

	useEffect(() => {
		analytics.composeOpened();
	}, []);

	useEffect(() => () => globalOutgoingMailData.reset(), []);

	return (
		<GenericLayout>
			<FullPageContent>
				<div className={css.header}>
					<div className={css.headerTitle}>Compose mail</div>

					<div className={css.headerActions}>
						<ActionButton
							look={ActionButtonLook.DANGEROUS}
							onClick={() => {
								navigate(
									generatePath(RoutePath.MAIL_FOLDER, { folderId: mailStore.lastActiveFolderId }),
								);
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
					onSent={() =>
						navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: mailStore.lastActiveFolderId }))
					}
				/>

				{mailer.sending && <OverlappingLoader text="Broadcasting your message to blockchain ..." />}
			</FullPageContent>
		</GenericLayout>
	);
});
