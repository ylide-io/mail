import { EditOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import Tooltip from 'antd/es/tooltip';
import { observer } from 'mobx-react';
import React from 'react';
import { generatePath } from 'react-router-dom';

import { walletsMeta } from '../../../constants';
import { AdaptiveAddress } from '../../../controls/adaptiveAddress/adaptiveAddress';
import { Blockie } from '../../../controls/Blockie';
import domain from '../../../stores/Domain';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/navigate';
import css from './accountsPopup.module.scss';

const AccountItem = observer(({ account }: { account: DomainAccount }) => {
	const nav = useNav();

	return (
		<div className={css.item} key={account.account.address}>
			<Blockie className={css.itemIcon} address={account.account.address} />
			<div className={css.itemBody}>
				<div className={css.itemName}>
					<div className={css.itemNameInner}>{account.name}</div>
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
				<div className={css.itemWallet}>
					{walletsMeta[account.wallet.wallet].logo(12)} {walletsMeta[account.wallet.wallet].title}
				</div>
				<AdaptiveAddress className={css.itemAddress} address={account.account.address} />
			</div>
			<div className={css.itemActions}>
				<Tooltip title="Logout">
					<Button
						danger
						icon={<LogoutOutlined />}
						onClick={async () => {
							await account.wallet.disconnectAccount(account);
							await domain.accounts.removeAccount(account);
							if (domain.accounts.activeAccounts.length === 0) {
								nav(generatePath(RoutePath.WALLETS));
							}
						}}
					/>
				</Tooltip>
			</div>
		</div>
	);
});

export const AccountsPopup = observer(() => {
	const nav = useNav();

	return (
		<div className={css.root}>
			{domain.accounts.accounts.map(acc => (
				<AccountItem key={acc.account.address} account={acc} />
			))}

			<div className={css.addAccountRow}>
				<Button type="primary" icon={<PlusOutlined />} onClick={() => nav(RoutePath.WALLETS)}>
					Connect account
				</Button>
			</div>
		</div>
	);
});
