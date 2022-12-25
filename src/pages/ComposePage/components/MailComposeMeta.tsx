import { Input, Select } from 'antd';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';
import { getNameOfJSDocTypedef } from 'typescript';
import { RecipientsSelect } from '../../../controls/RecipientSelect';
import domain from '../../../stores/Domain';
import mailbox from '../../../stores/Mailbox';
import { shrinkAddress } from '../../../utils/shrinkAddress';

@observer
export class MailComposeMeta extends PureComponent {
	state = {
		loaded: false,
	};

	componentDidMount(): void {
		if (!mailbox.from && domain.accounts.activeAccounts.length) {
			mailbox.from = domain.accounts.activeAccounts[0];
		}

		const queryParams = () => {
			const result: Record<string, string | undefined> = {};
			new URLSearchParams(window.location.search).forEach((value, key) => {
				result[key] = value;
			});
			return result;
		};

		const searchParams = queryParams();

		const input = searchParams.input;
		const type = searchParams.type as 'address' | 'contact' | 'ns' | 'invalid';
		const address = searchParams.address;
		const subject = searchParams.subject;

		if ((type === 'address' && address !== undefined) || (type === 'ns' && address !== undefined)) {
			mailbox.to = [
				{
					loading: true,
					input: input || '',
					type: type,
					address: address || '',
					isAchievable: null,
					comment: '',
				},
			];
		}

		mailbox.subject = subject || '';

		this.setState(state => ({ loaded: true }));
	}

	render() {
		return (
			<div className="mail-meta compose-meta">
				<div className="mail-params">
					<div className="mmp-row">
						<label className="mmp-row-title">From:</label>
						<div className="mmp-row-value" style={{ position: 'relative', zIndex: 2 }}>
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
						<div className="mmp-row-value" style={{ position: 'relative', zIndex: 2 }}>
							{this.state.loaded && <RecipientsSelect mutableValues={mailbox.to} />}
						</div>
					</div>
					<div className="mmp-row">
						<label className="mmp-row-title">Subject:</label>
						<div className="mmp-row-value">
							<Input
								type="text"
								style={{ width: '100%' }}
								value={mailbox.subject}
								onChange={e => (mailbox.subject = e.target.value)}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
