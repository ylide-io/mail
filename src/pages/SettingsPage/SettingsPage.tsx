import React from 'react';
import GenericLayout from '../../layouts/GenericLayout';
import { observer } from 'mobx-react';
import mailList from '../../stores/MailList';

const SettingsPage = observer(() => {
	return (
		<GenericLayout>
			<div className="mail-page animated fadeInRight">
				<div className="mail-top contacts-mail-top">
					<div className="mail-header">
						<h2 className="mailbox-title">Settings</h2>
					</div>
				</div>
				<div className="page-body">
					<div style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
						<span style={{ marginRight: 50 }}>Save decoded mails to internal storage</span>
						<input
							checked={!!mailList.saveDecodedMessages}
							onChange={() => mailList.setSaveDecodedSetting(!mailList.saveDecodedMessages)}
							type="checkbox"
						/>
					</div>
				</div>
			</div>
		</GenericLayout>
	);
});

export default SettingsPage;
