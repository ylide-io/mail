import clsx from 'clsx';
import { observable, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { AnchorHTMLAttributes, Fragment, PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath, useLocation } from 'react-router-dom';

import { FeedManagerApi } from '../../../api/feedManagerApi';
import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArchiveSvg } from '../../../icons/archive.svg';
import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { ReactComponent as SettingsSvg } from '../../../icons/ic20/settings.svg';
import { ReactComponent as SidebarMenuSvg } from '../../../icons/ic28/sidebarMenu.svg';
import { ReactComponent as SidebarMenuCloseSvg } from '../../../icons/ic28/sidebarMenu_close.svg';
import { ReactComponent as InboxSvg } from '../../../icons/inbox.svg';
import { ReactComponent as SentSvg } from '../../../icons/sent.svg';
import { ReactComponent as TwitterSvg } from '../../../icons/social/twitter.svg';
import { sideFeedIcon } from '../../../icons/static/sideFeedIcon';
import { SettingsSection } from '../../../pages/settings/settingsPage';
import { analytics } from '../../../stores/Analytics';
import {
	activeTvmProjects,
	activeVenomProjects,
	BlockchainProjectId,
	blockchainProjectsMeta,
} from '../../../stores/blockchainProjects/blockchainProjects';
import { browserStorage } from '../../../stores/browserStorage';
import domain from '../../../stores/Domain';
import { feedSettings } from '../../../stores/FeedSettings';
import { FolderId, getFolderName, MailList } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { useOpenMailCompose } from '../../../utils/mail';
import { constrain } from '../../../utils/number';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AdaptiveAddress } from '../../adaptiveAddress/adaptiveAddress';
import { AdaptiveText } from '../../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../../props';
import { toast } from '../../toast/toast';
import css from './sidebarMenu.module.scss';

export const isSidebarOpen = observable.box(false);

export enum Section {
	VENOM_PROJECTS = 'venom_projects',
	TVM_PROJECTS = 'tvm_projects',
	FEED = 'feed',
	FEED_DISCOVERY = 'feed_discovery',
	MAIL = 'mail',
	OTC = 'otc',
}

//

interface SidebarBurgerProps extends PropsWithClassName, PropsWithChildren<{}> {}

export const SidebarBurger = observer(({ className, children }: SidebarBurgerProps) => (
	<div className={clsx(css.burger, className)}>
		<ActionButton
			size={ActionButtonSize.MEDIUM}
			icon={isSidebarOpen.get() ? <SidebarMenuCloseSvg /> : <SidebarMenuSvg />}
			onClick={() => isSidebarOpen.set(!isSidebarOpen.get())}
		>
			{children}
		</ActionButton>
	</div>
));

//

interface SidebarSectionProps extends PropsWithChildren<{}> {
	section: Section;
	title: ReactNode;
}

const SidebarSection = observer(({ children, section, title }: SidebarSectionProps) => (
	<div className={css.section}>
		<div className={css.sectionTitle}>
			{title}
			<ActionButton
				look={ActionButtonLook.LITE}
				icon={browserStorage.isSidebarSectionFolded(section) ? <ArrowDownSvg /> : <ArrowUpSvg />}
				onClick={() => browserStorage.toggleSidebarSectionFolding(section)}
			/>
		</div>

		<div
			className={clsx(
				css.sectionContent,
				browserStorage.isSidebarSectionFolded(section) || css.sectionContent_open,
			)}
		>
			{children}
		</div>
	</div>
));

//

enum SidebarButtonLook {
	SUBMENU = 'SUBMENU',
	SECTION = 'SECTION',
}

interface SidebarButtonProps {
	look?: SidebarButtonLook;
	href: string;
	isActiveChecker?: (pathname: string) => boolean;
	icon?: ReactNode;
	name: ReactNode;
	onClick?: () => void;
	rightButton?: {
		icon: ReactNode;
		title?: string;
		onClick: () => void;
	};
}

export const SidebarButton = observer(
	({ look, href, isActiveChecker, icon, name, rightButton, onClick }: SidebarButtonProps) => {
		const location = useLocation();
		const navigate = useNav();

		const isActive = location.pathname === href || isActiveChecker?.(location.pathname);

		const isExternal = !href.startsWith('/');
		const externalProps: AnchorHTMLAttributes<HTMLAnchorElement> = isExternal
			? {
					target: '_blank',
					rel: 'noreferrer',
			  }
			: {};

		const lookClass =
			look &&
			{
				[SidebarButtonLook.SUBMENU]: css.sectionLink_submenu,
				[SidebarButtonLook.SECTION]: css.sectionLink_section,
			}[look];

		return (
			<a
				{...externalProps}
				className={clsx(css.sectionLink, lookClass, isActive && css.sectionLink_active)}
				href={href}
				onClick={e => {
					if (!isExternal) {
						e.preventDefault();
						isSidebarOpen.set(false);
						navigate(href);
						onClick?.();
					}
				}}
			>
				{icon && <div className={css.sectionLinkIconLeft}>{icon}</div>}
				<div className={css.sectionLinkTitle}>{name}</div>

				{rightButton && (
					<ActionButton
						className={css.sectionRightButton}
						look={ActionButtonLook.LITE}
						icon={rightButton.icon}
						title={rightButton.title}
						onClick={e => {
							e.preventDefault();
							e.stopPropagation();
							rightButton?.onClick();
						}}
					/>
				)}
			</a>
		);
	},
);

//

export const SidebarSmartFeedSection = observer(() => {
	const navigate = useNav();
	const accounts = domain.accounts.activeAccounts;

	return (
		<SidebarSection section={Section.FEED} title="Feed">
			<SidebarButton
				href={generatePath(RoutePath.FEED_SMART)}
				icon={sideFeedIcon(14)}
				onClick={() => {
					if (REACT_APP__APP_MODE === AppMode.MAIN_VIEW) {
						analytics.mainviewSmartFeedClick();
					}
				}}
				name="Smart feed"
			/>

			{accounts.map((account, i) => (
				<SidebarButton
					key={i}
					look={SidebarButtonLook.SUBMENU}
					href={generatePath(RoutePath.FEED_SMART_ADDRESS, { address: account.account.address })}
					icon={<ContactSvg />}
					name={<AdaptiveText text={account.name || account.account.address} />}
					onClick={() => {
						if (REACT_APP__APP_MODE === AppMode.MAIN_VIEW) {
							analytics.mainviewPersonalFeedClick(account.account.address);
						}
					}}
					rightButton={
						REACT_APP__APP_MODE === AppMode.MAIN_VIEW
							? {
									icon: <SettingsSvg />,
									title: 'Account Settings',
									onClick: () => {
										if (!account.mainViewKey) {
											return toast('Please complete the onboarding first ❤');
										}

										analytics.mainviewFeedSettingsClick(account.account.address);

										isSidebarOpen.set(false);
										navigate(
											generatePath(RoutePath.SETTINGS_ADDRESS_SECTION, {
												address: account.account.address,
												section: SettingsSection.SOURCES,
											}),
										);
									},
							  }
							: undefined
					}
				/>
			))}
		</SidebarSection>
	);
});

//

export const TrialPeriodSection = observer(() => {
	const accounts = domain.accounts.activeAccounts;

	const paymentInfoQuery = useQuery(['sidebar', 'trials', accounts.map(a => a.mainViewKey).join(',')], () =>
		Promise.all(
			accounts.map(account =>
				FeedManagerApi.getPaymentInfo({ token: account.mainViewKey })
					.then(info => ({
						...info,
						account,
					}))
					.catch(() => undefined),
			),
		),
	);

	const trials = paymentInfoQuery.data?.filter(info => info?.status.active);

	return (
		<>
			{!!trials?.length && <div className={css.divider} />}

			{trials?.map((info, i) => (
				<Fragment key={i}>
					{info?.status.active && (
						<div className={css.trial}>
							<b>7-day trial period</b>
							<div className={css.trialProgress}>
								<div
									className={css.trialProgressValue}
									style={{
										width: `${
											constrain(
												1 - (info.status.until - Date.now() / 1000) / (60 * 60 * 24 * 7),
												0,
												1,
											) * 100
										}%`,
									}}
								/>
							</div>
							<AdaptiveAddress
								className={css.trialAddress}
								address={info.account.account.address}
								maxLength={12}
							/>
						</div>
					)}
				</Fragment>
			))}
		</>
	);
});

//

export const SidebarMailSection = observer(() => {
	const openMailCompose = useOpenMailCompose();

	const accounts = domain.accounts.activeAccounts;

	const [hasNewMessages, setHasNewMessages] = useState(false);

	useEffect(() => {
		const mailList = new MailList();

		mailList.init({
			mailbox: {
				accounts,
				folderId: FolderId.Inbox,
			},
		});

		const key = accounts
			.map(a => a.account.address)
			.sort()
			.join(',');

		const dispose = reaction(
			() => ({
				newMessagesCount: mailList.newMessagesCount,
				messagesData: mailList.messagesData,
				lastMailboxCheckDate: browserStorage.lastMailboxCheckDate,
			}),
			({ newMessagesCount, messagesData, lastMailboxCheckDate }) => {
				if (newMessagesCount) {
					mailList.drainNewMessages();
				}

				const lastMessage = messagesData[0];
				const lastCheckedDate = lastMailboxCheckDate[key];

				setHasNewMessages(
					!!lastMessage && (!lastCheckedDate || lastMessage.raw.msg.createdAt > lastCheckedDate),
				);
			},
		);

		return () => {
			dispose();
			mailList.destroy();
		};
	}, [accounts]);

	return (
		<SidebarSection section={Section.MAIL} title="Mail">
			<ActionButton
				look={ActionButtonLook.PRIMARY}
				className={css.sectionButton}
				onClick={() => {
					isSidebarOpen.set(false);
					openMailCompose({ place: 'sidebar' });
				}}
			>
				Compose mail
			</ActionButton>

			<SidebarButton
				href={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox })}
				icon={<InboxSvg />}
				name={
					<div className={css.inboxButton}>
						{getFolderName(FolderId.Inbox)}
						{hasNewMessages && <div className={css.inboxNotification} title="You have new messages" />}
					</div>
				}
			/>

			<SidebarButton
				href={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent })}
				icon={<SentSvg />}
				name={getFolderName(FolderId.Sent)}
			/>

			<SidebarButton
				href={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive })}
				icon={<ArchiveSvg />}
				name={getFolderName(FolderId.Archive)}
			/>
		</SidebarSection>
	);
});

//

export const SidebarMenu = observer(() => {
	const tags = feedSettings.tags;
	const navigate = useNav();

	function renderProjects(projects: BlockchainProjectId[]) {
		return projects.map(id => {
			const meta = blockchainProjectsMeta[id];

			return (
				<SidebarButton
					key={id}
					href={generatePath(RoutePath.FEED_PROJECT_POSTS, { projectId: meta.id })}
					name={meta.name}
					icon={meta.logo}
				/>
			);
		});
	}

	return (
		<div className={css.root}>
			{REACT_APP__APP_MODE === AppMode.OTC && (
				<SidebarSection section={Section.OTC} title="OTC Trading">
					<SidebarButton
						href={generatePath(RoutePath.OTC_ASSETS)}
						icon={<InboxSvg />}
						name="Asset Explorer"
					/>

					<SidebarButton href={generatePath(RoutePath.OTC_CHATS)} icon={<SentSvg />} name="Chats" />
				</SidebarSection>
			)}

			{REACT_APP__APP_MODE === AppMode.MAIN_VIEW && <SidebarSmartFeedSection />}

			{REACT_APP__APP_MODE === AppMode.HUB && (
				<>
					<div>
						<SidebarButton
							look={SidebarButtonLook.SECTION}
							href={generatePath(RoutePath.FEED_PROJECT_POSTS, {
								projectId: BlockchainProjectId.GENERAL,
							})}
							name={blockchainProjectsMeta[BlockchainProjectId.GENERAL].name}
							icon={blockchainProjectsMeta[BlockchainProjectId.GENERAL].logo}
						/>

						<SidebarButton
							look={SidebarButtonLook.SECTION}
							href={generatePath(RoutePath.FEED_PROJECT_POSTS, {
								projectId: BlockchainProjectId.ETH_WHALES,
							})}
							name={blockchainProjectsMeta[BlockchainProjectId.ETH_WHALES].name}
							icon={blockchainProjectsMeta[BlockchainProjectId.ETH_WHALES].logo}
						/>
					</div>

					<SidebarSection section={Section.VENOM_PROJECTS} title="Venom Projects">
						{renderProjects(activeVenomProjects)}
					</SidebarSection>

					<SidebarSection section={Section.TVM_PROJECTS} title="TVM 주요정보">
						{renderProjects(activeTvmProjects)}
					</SidebarSection>

					<ActionButton
						className={css.sectionButton}
						onClick={() => {
							analytics.openCreateCommunityForm();
							window.open('https://forms.gle/p9141gy5wn7DCjZA8', '_blank')?.focus();
						}}
					>
						Create community
					</ActionButton>
				</>
			)}

			{REACT_APP__APP_MODE === AppMode.MAIN_VIEW && (
				<SidebarSection
					section={Section.FEED_DISCOVERY}
					title={REACT_APP__APP_MODE === AppMode.MAIN_VIEW ? 'Discovery' : 'Feed'}
				>
					{/* TODO: KONST */}
					{tags === 'error' ? (
						<></>
					) : tags === 'loading' ? (
						<div>Loading</div>
					) : (
						tags.map(t => (
							<SidebarButton
								key={t.id}
								href={generatePath(RoutePath.FEED_CATEGORY, { tag: t.id.toString() })}
								name={t.name}
								onClick={() => {
									if (REACT_APP__APP_MODE === AppMode.MAIN_VIEW) {
										analytics.mainviewTagFeedClick(t.id);
									}
								}}
							/>
						))
					)}
				</SidebarSection>
			)}

			{REACT_APP__APP_MODE === AppMode.HUB && <SidebarMailSection />}

			{REACT_APP__APP_MODE === AppMode.MAIN_VIEW && <TrialPeriodSection />}

			<div className={css.divider} />
			<div className={css.socials}>
				<div className={css.socialItem}>
					<a
						href="https://twitter.com/mainview_io"
						target="_blank noreferrer"
						title="Twitter"
						onClick={() => analytics.mainviewTwitterClick()}
					>
						<span>Follow on</span>
						<TwitterSvg />
					</a>
				</div>
				<div className={css.socialItem}>
					<a
						href={RoutePath.FAQ}
						onClick={e => {
							analytics.mainviewFaqClick();
							e.preventDefault();
							navigate(RoutePath.FAQ);
						}}
					>
						FAQ
					</a>
				</div>
			</div>
		</div>
	);
});
