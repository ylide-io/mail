import { Select } from 'antd';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';
import { RecipientsSelect } from '../../../controls/RecipientSelect';
import domain from '../../../stores/Domain';
import mailbox from '../../../stores/Mailbox';

@observer
export class MailMeta extends PureComponent {
	componentDidMount(): void {
		if (!mailbox.from && domain.accounts.activeAccounts.length) {
			mailbox.from = domain.accounts.activeAccounts[0];
		}
	}

	render() {
		return (
			<>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">From:</label>
					<div className="col-sm-11" style={{ position: 'relative', zIndex: 2 }}>
						<Select
							style={{ width: '100%' }}
							value={mailbox.from ? String(domain.accounts.activeAccounts.indexOf(mailbox.from)) : ''}
							onSelect={(val: string) => {
								mailbox.from = domain.accounts.activeAccounts[Number(val)];
							}}
						>
							{domain.accounts.activeAccounts.map((acc, idx) => (
								<Select.Option key={idx} value={String(idx)}>
									{acc.account.address} [
									{acc.wallet.factory.wallet === 'web3' ? 'MetaMask' : 'EverWallet'}]
								</Select.Option>
							))}
						</Select>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">To:</label>
					<div className="col-sm-11" style={{ position: 'relative', zIndex: 2 }}>
						<RecipientsSelect mutableValues={mailbox.to} />
					</div>
				</div>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">Subject:</label>
					<div className="col-sm-11">
						<input
							type="text"
							className="form-control"
							value={mailbox.subject}
							onChange={e => (mailbox.subject = e.target.value)}
						/>
					</div>
				</div>
			</>
		);
	}
}
