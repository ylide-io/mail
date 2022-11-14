import React from 'react';
import domain from '../../stores/Domain';
import { useNav } from '../../utils/navigate';
import { Avatar, Button, Dropdown } from 'antd';
import { DownOutlined, EditOutlined, LogoutOutlined, PlusOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react';
import Tooltip from 'antd/es/tooltip';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { Blockie } from '../../controls/Blockie';
import { walletsMap } from '../../constants';

const AccountItem = observer(({ account }: { account: DomainAccount }) => {
	const nav = useNav();

	return (
		<div className="accounts-list-item" key={account.account.address}>
			<div className="ali-icon">
				<Blockie address={account.account.address} />
			</div>
			<div className="ali-body">
				<div className="ali-title">
					<div className="ali-title-name">
						<div>{account.name}</div>
						<Tooltip title="Rename">
							<Button
								onClick={async () => {
									const newName = prompt('Enter new account name: ', account.name);
									if (newName) {
										await account.rename(newName);
									}
								}}
								style={{ marginLeft: 2, marginTop: 1, color: '#808080' }}
								type="text"
								size="small"
								icon={<EditOutlined />}
							/>
						</Tooltip>
					</div>
					<div className="via-wallet">
						{walletsMap[account.wallet.wallet].logo(12)} {walletsMap[account.wallet.wallet].title}
					</div>
				</div>
				<div className="ali-address">{account.account.address}</div>
			</div>
			<div className="ali-actions">
				<Tooltip title="Logout">
					<Button
						danger
						icon={<LogoutOutlined />}
						onClick={async () => {
							await account.wallet.disconnectAccount(account);
							await domain.accounts.removeAccount(account);
							if (domain.accounts.activeAccounts.length === 0) {
								nav('/connect-wallets');
							}
						}}
					/>
				</Tooltip>
			</div>
		</div>
	);
});

const Header = observer(() => {
	const nav = useNav();

	const newMenu = (
		<div className="accounts-list">
			{domain.accounts.accounts.map(acc => (
				<AccountItem key={acc.account.address} account={acc} />
			))}
			<div className="accounts-list-item add-account-item">
				<Button type="primary" icon={<PlusOutlined />} onClick={() => nav('/connect-wallets')}>
					Connect account
				</Button>
			</div>
		</div>
	);

	return (
		<div className="header">
			<div className="side-block header-logo">
				<img src="https://ylide.io/images/logo-medium-p-500.png" alt="Logo" className="header-logo-image" />
			</div>
			<div className="main-block header-main">
				<div className="header-block">
					<Tooltip title="Manage contacts and folders">
						<UsergroupAddOutlined
							onClick={e => {
								e.preventDefault();
								nav('/contacts');
							}}
							style={{ fontSize: 20 }}
						/>
					</Tooltip>
				</div>
				{/* <div className="header-block">
					<Tooltip title="Settings">
						<SettingFilled
							onClick={e => {
								e.preventDefault();
								nav('/settings');
							}}
							style={{ fontSize: 20 }}
						/>
					</Tooltip>
				</div> */}
				<div className="header-block">
					<Dropdown overlay={newMenu}>
						<div className="users-block">
							<div className="users-block-avatars">
								{domain.accounts.activeAccounts.map(acc => (
									<Avatar
										key={acc.account.address}
										icon={<Blockie address={acc.account.address} />}
									/>
								))}
							</div>
							<div className="users-block-text">{`Connected ${
								domain.accounts.activeAccounts.length
							} account${domain.accounts.activeAccounts.length > 1 ? 's' : ''}`}</div>
							<div className="users-block-icon">
								<DownOutlined size={16} />
							</div>
						</div>
					</Dropdown>
				</div>
			</div>
		</div>
	);
});

export default Header;
