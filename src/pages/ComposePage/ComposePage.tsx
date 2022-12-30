import React, { useEffect } from 'react';
import { GenericLayout } from '../../layouts/GenericLayout';
import { smallButtonIcons } from '../../components/smallButton/smallButton';
import { useNav } from '../../utils/navigate';
import mailer from '../../stores/Mailer';
import { observer } from 'mobx-react';
import mailList from '../../stores/MailList';
import { OverlappingLoader } from '../../controls/OverlappingLoader';
import ComposeMailFooter from './components/Mailbox/ComposeMailFooter';
import ComposeMailBody from './components/Mailbox/ComposeMailBody';
import { MailComposeMeta } from './components/MailComposeMeta';
import { analytics } from '../../stores/Analytics';
import { ActionButton, ActionButtonStyle } from '../../components/ActionButton/ActionButton';

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
