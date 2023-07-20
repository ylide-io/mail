import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { browserStorage } from '../../stores/browserStorage';

export const SettingsPage = () => {
	return (
		<GenericLayout>
			<div className="mail-page">
				<div className="mail-top contacts-mail-top">
					<div className="mail-header">
						<h2 className="mailbox-title">Settings</h2>
					</div>
				</div>
				<div className="page-body">
					<div style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
						<span style={{ marginRight: 50 }}>Save decoded mails to internal storage</span>
						<input
							checked={browserStorage.saveDecodedMessages}
							onChange={() => (browserStorage.saveDecodedMessages = !browserStorage.saveDecodedMessages)}
							type="checkbox"
						/>
					</div>
				</div>
			</div>
		</GenericLayout>
	);
};
