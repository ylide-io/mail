import { Select } from 'antd';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonStyle } from '../../components/ActionButton/ActionButton';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { RecipientInput, RecipientInputItem } from '../../components/recipientInput/recipientInput';
import { smallButtonIcons } from '../../components/smallButton/smallButton';
import { TextField } from '../../components/textField/textField';
import { walletsMeta } from '../../constants';
import { OverlappingLoader } from '../../controls/OverlappingLoader';
import { analytics } from '../../stores/Analytics';
import domain from '../../stores/Domain';
import mailer from '../../stores/Mailer';
import { useMailStore } from '../../stores/MailList';
import { globalOutgoingMailData } from '../../stores/outgoingMailData';
import { RoutePath } from '../../stores/routePath';
import { useNav } from '../../utils/navigate';
import { truncateInMiddle } from '../../utils/string';
import ComposeMailFooter from './components/Mailbox/ComposeMailFooter';
import MailboxEditor from './components/Mailbox/MailboxEditor/MailboxEditor';

export const ComposePage = observer(() => {
	const navigate = useNav();
	const lastActiveFolderId = useMailStore(state => state.lastActiveFolderId);

	useEffect(() => {
		analytics.composeOpened();
	}, []);

	useEffect(() => {
		if (!globalOutgoingMailData.from) {
			globalOutgoingMailData.from = domain.accounts.activeAccounts[0];
		}
	}, []);

	const [recipients, setRecipients] = useState<RecipientInputItem[]>([]);

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
									<Select
										style={{ width: '100%' }}
										value={
											globalOutgoingMailData.from
												? String(
														domain.accounts.activeAccounts.indexOf(
															globalOutgoingMailData.from,
														),
												  )
												: ''
										}
										onSelect={(val: string) => {
											globalOutgoingMailData.from = domain.accounts.activeAccounts[Number(val)];
										}}
									>
										{domain.accounts.activeAccounts.map((acc, idx) => (
											<Select.Option key={idx} value={String(idx)}>
												{`${acc.name} (${truncateInMiddle(acc.account.address, 10, '..')}) `}[
												{walletsMeta[acc.wallet.wallet].title}]
											</Select.Option>
										))}
									</Select>
								</div>
							</div>
							<div className="mmp-row">
								<label className="mmp-row-title">To:</label>
								<div className="mmp-row-value">
									<RecipientInput initialValue={globalOutgoingMailData.to} onChange={setRecipients} />
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
						<MailboxEditor />
					</div>

					<ComposeMailFooter recipients={recipients} />

					{mailer.sending ? <OverlappingLoader text="Broadcasting your message to blockchain..." /> : null}
				</div>
			</div>
		</GenericLayout>
	);
});
