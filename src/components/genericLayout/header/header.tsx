import { EVMNetwork } from '@ylide/ethereum';
import clsx from 'clsx';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react';
import { PropsWithChildren, RefObject, useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { createSearchParams, generatePath } from 'react-router-dom';

import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { ReactComponent as PlusSvg } from '../../../icons/ic20/plus.svg';
import { ReactComponent as TickSvg } from '../../../icons/ic20/tick.svg';
import { ReactComponent as ContactsSvg } from '../../../icons/ic28/contacts.svg';
import { ReactComponent as NotificationsSvg } from '../../../icons/ic28/notifications.svg';
import { postWidgetMessage, WidgetId, WidgetMessageType } from '../../../pages/widgets/widgets';
import { BrowserStorage, browserStorage, BrowserStorageKey } from '../../../stores/browserStorage';
import domain from '../../../stores/Domain';
import { FolderId } from '../../../stores/MailList';
import { getGlobalOutgoingMailData } from '../../../stores/outgoingMailData';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { HorizontalAlignment } from '../../../utils/alignment';
import { invariant } from '../../../utils/assert';
import { openInNewWidnow } from '../../../utils/misc';
import { useIsMatchesPath, useNav } from '../../../utils/url';
import { useWindowSize } from '../../../utils/useWindowSize';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../actionButton/actionButton';
import { AppLogo } from '../../appLogo/appLogo';
import { Avatar } from '../../avatar/avatar';
import { AnchoredPopup } from '../../popup/anchoredPopup/anchoredPopup';
import { PropsWithClassName } from '../../props';
import { Spinner } from '../../spinner/spinner';
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

interface HeaderPopupProps extends PropsWithChildren {
	anchorRef: RefObject<HTMLElement>;
	onClose?: () => void;
}

const HeaderPopup = observer(({ children, anchorRef, onClose }: HeaderPopupProps) => {
	const { windowWidth } = useWindowSize();

	return (
		<AnchoredPopup
			className={css.headerPopup}
			anchorRef={anchorRef}
			horizontalAlign={windowWidth > 640 ? HorizontalAlignment.END : HorizontalAlignment.MIDDLE}
			alignerOptions={{
				fitLeftToViewport: true,
			}}
			onCloseRequest={onClose}
		>
			<div className={css.headerPopupInner}>{children}</div>
		</AnchoredPopup>
	);
});

//

const TransactionButton = observer(() => {
	const buttonRef = useRef(null);
	const [popupOpen, setPopupOpen] = useState(false);

	const txPlate = domain.txPlateVisible;
	const txHash = domain.publishingTxHash;

	// Open popup
	useEffect(() => setPopupOpen(true), []);

	// Open popup when finished
	useEffect(() => {
		txHash && setPopupOpen(true);
	}, [txHash]);

	return txPlate ? (
		<>
			<ActionButton
				ref={buttonRef}
				size={ActionButtonSize.LARGE}
				look={ActionButtonLook.LITE}
				icon={txHash ? <TickSvg /> : <Spinner />}
				title={txHash ? 'Transaction complete' : 'Transaction in progress'}
				onClick={() => setPopupOpen(!popupOpen)}
			/>

			{popupOpen && (
				<HeaderPopup
					anchorRef={buttonRef}
					onClose={() => {
						setPopupOpen(false);

						// Hide everything if hash published
						if (txHash) {
							domain.txPlateVisible = false;
							domain.publishingTxHash = '';
						}
					}}
				>
					{txHash ? (
						<>
							<div className={css.central}>
								{domain.txWithBonus
									? `Your ${
											domain.txChain === EVMNetwork.FANTOM
												? '$FTM'
												: domain.txChain === EVMNetwork.GNOSIS
												? '$xDAI'
												: domain.txChain === EVMNetwork.POLYGON
												? '$MATIC'
												: 'tokens'
									  } has been sent`
									: 'Transaction successfully processed 👍'}
							</div>

							<ActionButton
								onClick={() => {
									if (domain.txChain === EVMNetwork.FANTOM) {
										openInNewWidnow(`https://ftmscan.com/tx/${txHash}`);
									} else if (domain.txChain === EVMNetwork.GNOSIS) {
										openInNewWidnow(`https://gnosisscan.io/tx/${txHash}`);
									} else if (domain.txChain === EVMNetwork.POLYGON) {
										openInNewWidnow(`https://polygonscan.com/tx/${txHash}`);
									}
								}}
							>
								Link to the transaction
							</ActionButton>
						</>
					) : (
						<>
							<b>
								{domain.txWithBonus
									? `Your ${
											domain.txChain === EVMNetwork.FANTOM
												? '$FTM'
												: domain.txChain === EVMNetwork.GNOSIS
												? '$xDAI'
												: domain.txChain === EVMNetwork.POLYGON
												? '$MATIC'
												: 'tokens'
									  } are on the way`
									: 'Transaction in progress'}
							</b>

							<div>Transaction is in queue. Please wait 10-15 seconds for it to be mined.</div>
						</>
					)}
				</HeaderPopup>
			)}
		</>
	) : (
		<></>
	);
});

//

const NOTIFICATIONS_ALERT_COUNT = 3;

interface NotificationsAlertData {
	enabledForCurrentAccounts?: boolean;
	alertNeeded?: boolean;
	alertCounter?: number;
}

class NotificationsAlert {
	constructor() {
		makeAutoObservable(this);
	}

	value: NotificationsAlertData =
		BrowserStorage.getItemWithTransform(BrowserStorageKey.NOTIFICATIONS_ALERT, item => {
			// Migration
			if (item === 'true' || item === 'false') {
				return {
					enabledForCurrentAccounts: false,
					alertNeeded: true,
					// Display only once
					alertCounter: NOTIFICATIONS_ALERT_COUNT - 1,
				} as NotificationsAlertData;
			}

			return JSON.parse(item);
		}) || {};

	patchValue(patch: NotificationsAlertData) {
		const newValue = { ...this.value, ...patch };

		BrowserStorage.setItem(BrowserStorageKey.NOTIFICATIONS_ALERT, JSON.stringify(newValue));
		this.value = newValue;
	}

	newAccountConnected() {
		this.patchValue({
			enabledForCurrentAccounts: false,
			alertNeeded: true,
			alertCounter: 0,
		});
	}

	remindAboutNotifications() {
		if (!this.value.enabledForCurrentAccounts && (this.value.alertCounter || 0) < 3) {
			this.patchValue({
				alertNeeded: true,
			});
		}
	}

	reminderHappened() {
		this.patchValue({
			alertNeeded: false,
			alertCounter: (this.value.alertCounter || 0) + 1,
		});
	}

	notificationsEnabled() {
		this.patchValue({
			enabledForCurrentAccounts: true,
		});
	}
}

export const notificationsAlert = new NotificationsAlert();

const NotificationsButton = observer(() => {
	const buttonRef = useRef(null);

	const openTgMutation = useMutation(async () => {
		const accounts = domain.accounts.activeAccounts;
		invariant(accounts.length, 'No accounts');

		const search = createSearchParams({ addresses: accounts.map(a => a.account.address) });

		const response = await fetch(`https://tg.ylide.io/get-link?${search}`);
		invariant(response.status >= 200 && response.status < 300, `Request failed ${response.status}`);

		const json: { data?: string; result: boolean } = await response.json();

		const tgUrl = json.data;
		invariant(tgUrl, 'No Telegram URL received');

		notificationsAlert.notificationsEnabled();
		setPopupOpen(false);

		openInNewWidnow(tgUrl);
	});

	const [animationNeeded, setAnimationNeeded] = useState(false);
	const [popupOpen, setPopupOpen] = useState(false);

	const alertNeeded = notificationsAlert.value.alertNeeded && !domain.txPlateVisible;

	useEffect(() => {
		if (alertNeeded) {
			// Reset if already animating
			setAnimationNeeded(false);
			setTimeout(() => setAnimationNeeded(true), 50);

			setPopupOpen(true);
			notificationsAlert.reminderHappened();
		}
	}, [alertNeeded]);

	return (
		<>
			<ActionButton
				ref={buttonRef}
				size={ActionButtonSize.LARGE}
				look={ActionButtonLook.LITE}
				icon={
					<div>
						<NotificationsSvg className={clsx(animationNeeded && css.notificationIcon_animated)} />
					</div>
				}
				title="Notifications"
				onClick={() => setPopupOpen(!popupOpen)}
			/>

			{popupOpen && (
				<HeaderPopup anchorRef={buttonRef} onClose={() => setPopupOpen(false)}>
					<div>
						Enable notifications on Telegram to get notified of new emails or when someone replies to your
						post.
					</div>

					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						isLoading={openTgMutation.isLoading}
						onClick={() => openTgMutation.mutate()}
					>
						Enable Notifications
					</ActionButton>
				</HeaderPopup>
			)}
		</>
	);
});

//

export const Header = observer(({ className }: PropsWithClassName) => {
	const navigate = useNav();

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
				<div className={css.rightButtons}>
					{domain.txPlateVisible && REACT_APP__APP_MODE !== AppMode.MAIN_VIEW && <TransactionButton />}

					{REACT_APP__APP_MODE === AppMode.HUB && domain.accounts.hasActiveAccounts && (
						<NotificationsButton />
					)}

					{REACT_APP__APP_MODE === AppMode.HUB && domain.accounts.hasActiveAccounts && (
						<ActionButton
							size={ActionButtonSize.LARGE}
							look={ActionButtonLook.LITE}
							icon={<ContactsSvg />}
							title="Contacts"
							href={generatePath(RoutePath.MAIL_CONTACTS)}
						/>
					)}
				</div>

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
