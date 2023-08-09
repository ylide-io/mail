import clsx from 'clsx';
import { observer } from 'mobx-react';
import { PropsWithChildren, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { ReactComponent as PlusSvg } from '../../../icons/ic20/plus.svg';
import { ReactComponent as ContactsSvg } from '../../../icons/ic28/contacts.svg';
import { postWidgetMessage, WidgetId, WidgetMessageType } from '../../../pages/widgets/widgets';
import { browserStorage } from '../../../stores/browserStorage';
import domain from '../../../stores/Domain';
import { FolderId } from '../../../stores/MailList';
import { getGlobalOutgoingMailData } from '../../../stores/outgoingMailData';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { useOpenMailCompose } from '../../../utils/mail';
import { useIsMatchesPath, useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AppLogo } from '../../appLogo/appLogo';
import { Avatar } from '../../avatar/avatar';
import { PropsWithClassName } from '../../props';
import { toast } from '../../toast/toast';
import { SidebarBurger } from '../sidebar/sidebarMenu';
import { AccountsPopup } from './accountsPopup/accountsPopup';
import css from './header.module.scss';
import { SearchField } from './searchField/searchField';

interface NavButtonProps extends PropsWithChildren {
	href: string;
}

const NavButton = ({ children, href }: NavButtonProps) => {
	const navigate = useNav();
	const isActive = useIsMatchesPath(href);

	return (
		<a
			className={clsx(css.navButton, isActive && css.navButton_active)}
			href={href}
			onClick={e => {
				e.preventDefault();
				navigate(href);
			}}
		>
			{children}
		</a>
	);
};

//

export const Header = observer(({ className }: PropsWithClassName) => {
	const navigate = useNav();
	const openMailCompose = useOpenMailCompose();

	const accountsPopupButtonRef = useRef(null);
	const [isAccountsPopupOpen, setAccountsPopupOpen] = useState(false);

	const accounts = domain.accounts.accounts;

	return (
		<div className={clsx(css.root, className)}>
			<div className={css.left}>
				<SidebarBurger />

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
			</div>

			<div className={css.center}>
				<NavButton href={generatePath(RoutePath.ROOT)}>Explore</NavButton>

				<NavButton href={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox })}>Mailbox</NavButton>

				<SearchField className={css.search} />
			</div>

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

				{accounts.length ? (
					<>
						<button
							ref={accountsPopupButtonRef}
							className={css.users}
							onClick={() => setAccountsPopupOpen(!isAccountsPopupOpen)}
						>
							<div>
								{accounts.map(acc => (
									<Avatar
										key={acc.account.address}
										className={css.usersAvatar}
										blockie={acc.account.address}
									/>
								))}
							</div>

							<div className={css.usersText}>
								{accounts.length} account
								{accounts.length > 1 ? 's' : ''} connected
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
