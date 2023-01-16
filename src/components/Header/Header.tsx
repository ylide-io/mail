import {
	DownOutlined,
	EditOutlined,
	LogoutOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	PlusOutlined,
	UsergroupAddOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown } from 'antd';
import Tooltip from 'antd/es/tooltip';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { walletsMap } from '../../constants';
import { AdaptiveAddress } from '../../controls/adaptiveAddress/adaptiveAddress';
import { Blockie } from '../../controls/Blockie';
import { YlideLargeLogo } from '../../icons/YlideLargeLogo';
import AlertModal from '../../modals/AlertModal';
import domain from '../../stores/Domain';
import { FolderId } from '../../stores/MailList';
import modals from '../../stores/Modals';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { useNav } from '../../utils/navigate';
import css from './Header.module.scss';

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
						<div className="ali-name-inner">{account.name}</div>
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
				<div className="ali-address">
					<AdaptiveAddress address={account.account.address} />
				</div>
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
								nav('/wallets');
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
	const [showQuest3, setShowQuest3] = useState(localStorage.getItem('quest3') !== 'false');

	const newMenu = (
		<div className="accounts-list">
			{domain.accounts.accounts.map(acc => (
				<AccountItem key={acc.account.address} account={acc} />
			))}
			<div className="accounts-list-item add-account-item">
				<Button type="primary" icon={<PlusOutlined />} onClick={() => nav('/wallets')}>
					Connect account
				</Button>
			</div>
		</div>
	);

	return (
		<div className="header">
			<div className="header-burger">
				<Button
					onClick={() => {
						modals.sidebarOpen = !modals.sidebarOpen;
					}}
					icon={modals.sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
				/>
			</div>

			<div className={css.logo}>
				<a
					href={`/mail/${FolderId.Inbox}`}
					onClick={e => {
						e.preventDefault();
						nav(`/mail/${FolderId.Inbox}`);
					}}
				>
					<YlideLargeLogo className={css.logoImage} />
				</a>
			</div>
			<div className="header-main">
				<div className="header-block">
					<div
						className={clsx(css.quest3Btn, { [css.shine]: showQuest3 })}
						onClick={() => {
							setShowQuest3(false);
							localStorage.setItem('quest3', 'false');
							AlertModal.show(
								'Ylide $1,000 giveaway on Quest3',
								'',
								<div style={{ fontSize: 14, marginTop: 20 }}>
									Hey there,
									<br />
									<br />
									Thank you for registering in Ylide Social Hub!
									<br />
									<br />
									Please use the code below to answer the question on Quest3:
									<br />
									<br />
									<br />
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 32,
											fontWeight: 'bold',
											textAlign: 'center',
										}}
									>
										ylide2023
									</div>
									<br />
									<br />
									More info about the quest available at our{' '}
									<a href="https://discord.gg/ylide" target="_blank" rel="noreferrer">
										Discord Community
									</a>{' '}
									or at Ylide's Quest profile:{' '}
									<a href="https://app.quest3.xyz/ylide" target="_blank" rel="noreferrer">
										https://app.quest3.xyz/ylide
									</a>
									<br />
									<br />
									<br />
									Best regards,
									<br />
									Ylide Team
									<br />
								</div>,
							);
						}}
					>
						Quest3
					</div>
				</div>
				<div className="header-block">
					<Tooltip title="Manage contacts and folders">
						<UsergroupAddOutlined
							onClick={e => {
								e.preventDefault();
								nav('/mail/contacts');
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
							<div className="users-block-text">
								<span>Connected&nbsp;</span>
								{domain.accounts.activeAccounts.length} account
								{domain.accounts.activeAccounts.length > 1 ? 's' : ''}
							</div>
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
