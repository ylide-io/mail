import { observer } from 'mobx-react';
import React, { useEffect } from 'react';

import { ActionButton, ActionButtonStyle } from '../../components/ActionButton/ActionButton';
import { smallButtonIcons } from '../../components/smallButton/smallButton';
import { OverlappingLoader } from '../../controls/OverlappingLoader';
import { GenericLayout } from '../../layouts/GenericLayout';
import { analytics } from '../../stores/Analytics';
import mailer from '../../stores/Mailer';
import mailList from '../../stores/MailList';
import { useNav } from '../../utils/navigate';
import ComposeMailBody from './components/Mailbox/ComposeMailBody';
import ComposeMailFooter from './components/Mailbox/ComposeMailFooter';
import { MailComposeMeta } from './components/MailComposeMeta';

export const ComposePage = observer(() => {
	const navigate = useNav();

	useEffect(() => {
		analytics.composeOpened();
	}, []);

	return (
		<GenericLayout>
			<div className="mail-page animated fadeInRight">
				<div className="mail-top compose-mail-top">
					<div className="mail-header">
						<h2 className="mailbox-title">Compose mail</h2>
						<div className="mail-actions">
							<ActionButton
								style={ActionButtonStyle.Dengerous}
								onClick={() => {
									navigate(`/${mailList.activeFolderId || 'inbox'}`);
								}}
								icon={<i className={`fa ${smallButtonIcons.cross}`} />}
							>
								Discard
							</ActionButton>
						</div>
					</div>
					<MailComposeMeta />
				</div>
				<div className="mail-body" style={{ position: 'relative' }}>
					<ComposeMailBody />
					<ComposeMailFooter />
					{mailer.sending ? <OverlappingLoader text="Broadcasting your message to blockchain..." /> : null}
				</div>
			</div>
		</GenericLayout>
	);
});
