import React from 'react';

import { GenericLayout } from '../../layouts/GenericLayout';
import { useMailStore } from '../../stores/MailList';

export const SettingsPage = () => {
	const { saveDecodedMessages, setSaveDecodedSetting } = useMailStore();

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
							checked={saveDecodedMessages}
							onChange={() => setSaveDecodedSetting(!saveDecodedMessages)}
							type="checkbox"
						/>
					</div>
				</div>
			</div>
		</GenericLayout>
	);
};
