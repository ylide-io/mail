import { observer } from 'mobx-react';
import React, { useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { ReactComponent as PlusSvg } from '../../../icons/ic20/plus.svg';
import { ReactComponent as ContactsSvg } from '../../../icons/ic28/contacts.svg';
import { postWidgetMessage, WidgetId, WidgetMessageType } from '../../../pages/widgets/widgets';
import { browserStorage } from '../../../stores/browserStorage';
import domain from '../../../stores/Domain';
import { getGlobalOutgoingMailData } from '../../../stores/outgoingMailData';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { useOpenMailCompose } from '../../../utils/mail';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AppLogo } from '../../appLogo/appLogo';
import { Avatar } from '../../avatar/avatar';
import { toast } from '../../toast/toast';
import { SidebarBurger } from '../sidebar/sidebarMenu';
import { AccountsPopup } from './accountsPopup/accountsPopup';
import css from './header.module.scss';

const Header = observer(() => {
	const navigate = useNav();
	const openMailCompose = useOpenMailCompose();

	const accountsPopupButtonRef = useRef(null);
	const [isAccountsPopupOpen, setAccountsPopupOpen] = useState(false);

	return (
		<div className={css.root}>
			<SidebarBurger className={css.burger} />

			{REACT_APP__APP_MODE === AppMode.HUB && domain.accounts.hasActiveAccounts && (
				<ActionButton
					className={css.composeButton}
					look={ActionButtonLook.PRIMARY}
					onClick={() => openMailCompose({ place: 'header' })}
				>
					Compose Mail
				</ActionButton>
			)}

			<a
				className={css.logo}
				href={generatePath(RoutePath.ROOT)}
				onClick={e => {
					e.preventDefault();
					navigate(generatePath(RoutePath.ROOT));
				}}
			>
				<AppLogo />
			</a>

			<div className={css.right}>
				{REACT_APP__APP_MODE === AppMode.HUB && domain.accounts.hasActiveAccounts && (
					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.LITE}
						icon={<ContactsSvg />}
						title="Contacts"
						onClick={e => {
							e.preventDefault();
							navigate(generatePath(RoutePath.MAIL_CONTACTS));
						}}
					/>
				)}

				{domain.accounts.hasActiveAccounts ? (
					<>
						<button
							ref={accountsPopupButtonRef}
							className={css.users}
							onClick={() => setAccountsPopupOpen(!isAccountsPopupOpen)}
						>
							<div>
								{domain.accounts.activeAccounts.map(acc => (
									<Avatar
										key={acc.account.address}
										className={css.usersAvatar}
										blockie={acc.account.address}
									/>
								))}
							</div>

							<div className={css.usersText}>
								{domain.accounts.activeAccounts.length} account
								{domain.accounts.activeAccounts.length > 1 ? 's' : ''}
								<span>&nbsp;connected</span>
							</div>

							<ArrowDownSvg className={css.usersIcon} />
						</button>

						{isAccountsPopupOpen && (
							<AccountsPopup
								anchorRef={accountsPopupButtonRef}
								onClose={() => setAccountsPopupOpen(false)}
							/>
						)}
					</>
				) : (
					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						icon={<PlusSvg />}
						onClick={() => connectAccount({ place: 'header' })}
					>
						Connect account
					</ActionButton>
				)}

				{browserStorage.widgetId === WidgetId.MAILBOX && (
					<ActionButton
						size={ActionButtonSize.LARGE}
						look={ActionButtonLook.LITE}
						icon={<CrossSvg style={{ width: 28, height: 28 }} />}
						title="Close"
						onClick={() => {
							if (getGlobalOutgoingMailData().sending) {
								toast('Please wait. Sending is in progress 👌');
							} else {
								postWidgetMessage(WidgetMessageType.MAILBOX__CLOSE);
							}
						}}
					/>
				)}
			</div>
		</div>
	);
});

export default Header;
