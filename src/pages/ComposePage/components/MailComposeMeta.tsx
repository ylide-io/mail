import { Select } from 'antd';
import { observer } from 'mobx-react';
import { useEffect } from 'react';

import { TextField } from '../../../components/textField/textField';
import { RecipientsSelect } from '../../../controls/RecipientSelect';
import domain from '../../../stores/Domain';
import mailbox from '../../../stores/Mailbox';
import { shrinkAddress } from '../../../utils/shrinkAddress';

export const MailComposeMeta = observer(() => {
	useEffect(() => {
		if (!mailbox.from && domain.accounts.activeAccounts.length) {
			mailbox.from = domain.accounts.activeAccounts[0];
		}
	}, []);

	return (
		<div className="mail-meta">
			<div className="mail-params">
				<div className="mmp-row">
					<label className="mmp-row-title">From:</label>
					<div className="mmp-row-value">
						<Select
							style={{ width: '100%' }}
							value={mailbox.from ? String(domain.accounts.activeAccounts.indexOf(mailbox.from)) : ''}
							onSelect={(val: string) => {
								mailbox.from = domain.accounts.activeAccounts[Number(val)];
							}}
						>
							{domain.accounts.activeAccounts.map((acc, idx) => (
								<Select.Option key={idx} value={String(idx)}>
									{(acc.name || 'No name') + ` (${shrinkAddress(acc.account.address, 10)})`} [
									{acc.wallet.factory.wallet === 'metamask' ? 'MetaMask' : 'EverWallet'}]
								</Select.Option>
							))}
						</Select>
					</div>
				</div>
				<div className="mmp-row">
					<label className="mmp-row-title">To:</label>
					<div className="mmp-row-value">
						<RecipientsSelect mutableValues={mailbox.to} />
					</div>
				</div>
				<div className="mmp-row">
					<label className="mmp-row-title">Subject:</label>
					<div className="mmp-row-value">
						<TextField value={mailbox.subject} onChange={value => (mailbox.subject = value)} />
					</div>
				</div>
			</div>
		</div>
	);
});
