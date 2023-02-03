import { observer } from 'mobx-react';
import React, { useEffect } from 'react';
import { generatePath } from 'react-router-dom';

import { AccountSelect } from '../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonStyle } from '../../components/ActionButton/ActionButton';
import { SendMailButton } from '../../components/composeMailForm/sendMailButton/sendMailButton';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { RecipientInput } from '../../components/recipientInput/recipientInput';
import { smallButtonIcons } from '../../components/smallButton/smallButton';
import { TextField } from '../../components/textField/textField';
import { OverlappingLoader } from '../../controls/OverlappingLoader';
import { analytics } from '../../stores/Analytics';
import mailer from '../../stores/Mailer';
import { useMailStore } from '../../stores/MailList';
import { globalOutgoingMailData } from '../../stores/outgoingMailData';
import { RoutePath } from '../../stores/routePath';
import { useNav } from '../../utils/navigate';
import { MailboxEditor } from './components/Mailbox/MailboxEditor/MailboxEditor';

export const ComposePage = observer(() => {
	const navigate = useNav();
	const lastActiveFolderId = useMailStore(state => state.lastActiveFolderId);

	useEffect(() => {
		analytics.composeOpened();
	}, []);

	useEffect(() => () => globalOutgoingMailData.reset(), []);

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
									navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: lastActiveFolderId }));
								}}
								icon={<i className={`fa ${smallButtonIcons.cross}`} />}
							>
								Discard
							</ActionButton>
						</div>
					</div>

					<div className="mail-meta">
						<div className="mail-params">
							<div className="mmp-row">
								<label className="mmp-row-title">From:</label>
								<div className="mmp-row-value">
									<AccountSelect
										activeAccount={globalOutgoingMailData.from}
										onChange={account => (globalOutgoingMailData.from = account)}
									/>
								</div>
							</div>
							<div className="mmp-row">
								<label className="mmp-row-title">To:</label>
								<div className="mmp-row-value">
									<RecipientInput value={globalOutgoingMailData.to} />
								</div>
							</div>
							<div className="mmp-row">
								<label className="mmp-row-title">Subject:</label>
								<div className="mmp-row-value">
									<TextField
										value={globalOutgoingMailData.subject}
										onChange={value => (globalOutgoingMailData.subject = value)}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="mail-body" style={{ position: 'relative' }}>
					<div className="mail-text">
						<MailboxEditor mailData={globalOutgoingMailData} />
					</div>

					<div className="mail-footer compose-mail-footer">
						<SendMailButton mailData={globalOutgoingMailData} />
					</div>

					{mailer.sending ? <OverlappingLoader text="Broadcasting your message to blockchain..." /> : null}
				</div>
			</div>
		</GenericLayout>
	);
});
