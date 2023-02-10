import { UsergroupAddOutlined } from '@ant-design/icons';
import { Avatar, Tooltip } from 'antd';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { Blockie } from '../../../controls/Blockie';
import { ReactComponent as ArrowDownSvg } from '../../../icons/arrowDown.svg';
import { YlideLargeLogo } from '../../../icons/YlideLargeLogo';
import AlertModal from '../../../modals/AlertModal';
import { browserStorage } from '../../../stores/browserStorage';
import domain from '../../../stores/Domain';
import { FolderId } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/navigate';
import { SidebarBurger } from '../sidebar/sidebarMenu';
import { AccountsPopup } from './accountsPopup/accountsPopup';
import css from './header.module.scss';

const Header = observer(() => {
	const nav = useNav();

	const accountsPopupButtonRef = useRef(null);
	const [isAccountsPopupOpen, setAccountsPopupOpen] = useState(false);

	return (
		<div className={css.root}>
			<SidebarBurger className={css.burger} />

			<div className={css.logo}>
				<a
					href={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox })}
					onClick={e => {
						e.preventDefault();
						nav(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox }));
					}}
				>
					<YlideLargeLogo className={css.logoImage} />
				</a>
			</div>
			<div className={css.main}>
				<div className={css.block}>
					<div
						className={clsx(css.quest3Btn, { [css.shine]: browserStorage.quest3 })}
						onClick={() => {
							browserStorage.quest3 = false;

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
				<div className={css.block}>
					<Tooltip title="Manage contacts and folders">
						<UsergroupAddOutlined
							onClick={e => {
								e.preventDefault();
								nav(generatePath(RoutePath.MAIL_CONTACTS));
							}}
							style={{ fontSize: 20 }}
						/>
					</Tooltip>
				</div>
				<div className={css.block}>
					<button
						ref={accountsPopupButtonRef}
						className={css.users}
						onClick={() => setAccountsPopupOpen(!isAccountsPopupOpen)}
					>
						<div className={css.usersAvatars}>
							{domain.accounts.accounts.map(acc => (
								<Avatar key={acc.account.address} icon={<Blockie address={acc.account.address} />} />
							))}
						</div>
						<div className={css.usersText}>
							{domain.accounts.accounts.length} account
							{domain.accounts.accounts.length > 1 ? 's' : ''}
							<span>&nbsp;connected</span>
						</div>
						<ArrowDownSvg className={css.usersIcon} />
					</button>

					{isAccountsPopupOpen && (
						<AccountsPopup anchorRef={accountsPopupButtonRef} onClose={() => setAccountsPopupOpen(false)} />
					)}
				</div>
			</div>
		</div>
	);
});

export default Header;
