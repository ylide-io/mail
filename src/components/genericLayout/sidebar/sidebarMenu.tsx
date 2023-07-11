import clsx from 'clsx';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { PropsWithChildren, ReactNode, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath, useLocation } from 'react-router-dom';

import { FeedCategory } from '../../../api/feedServerApi';
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
import { ReactComponent as DiscordSvg } from '../../../icons/social/discord.svg';
import { ReactComponent as LinkedInSvg } from '../../../icons/social/linkedIn.svg';
import { ReactComponent as MediumSvg } from '../../../icons/social/medium.svg';
import { ReactComponent as TelegramSvg } from '../../../icons/social/telegram.svg';
import { ReactComponent as TwitterSvg } from '../../../icons/social/twitter.svg';
import { sideAnalyticsIcon } from '../../../icons/static/sideAnalyticsIcon';
import { sideCultureIcon } from '../../../icons/static/sideCultureIcon';
import { sideEducationIcon } from '../../../icons/static/sideEducationIcon';
import { sideFeedIcon } from '../../../icons/static/sideFeedIcon';
import { sideMarketsIcon } from '../../../icons/static/sideMarketsIcon';
import { sidePolicyIcon } from '../../../icons/static/sidePolicyIcon';
import { sideProjectsIcon } from '../../../icons/static/sideProjectsIcon';
import { sideSecurityIcon } from '../../../icons/static/sideSecurityIcon';
import { sideTechnologyIcon } from '../../../icons/static/sideTechnologyIcon';
import { FeedSettingsPopup } from '../../../pages/feed/components/feedSettingsPopup/feedSettingsPopup';
import { analytics } from '../../../stores/Analytics';
import { browserStorage } from '../../../stores/browserStorage';
import domain, { useDomainAccounts } from '../../../stores/Domain';
import { getFeedCategoryName } from '../../../stores/Feed';
import { FolderId, MailList } from '../../../stores/MailList';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { RoutePath } from '../../../stores/routePath';
import { VenomProjectId, venomProjectsMeta } from '../../../stores/venomProjects/venomProjects';
import { useOpenMailCompose } from '../../../utils/mail';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AdaptiveText } from '../../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../../props';
import { toast } from '../../toast/toast';
import css from './sidebarMenu.module.scss';

export const isSidebarOpen = observable.box(false);

export enum Section {
	VENOM_PROJECTS = 'venom_projects',
	FEED = 'feed',
	FEED_DISCOVERY = 'feed_discovery',
	MAIL = 'mail',
	OTC = 'otc',
}

const getFeedCategoryIcon = (category: FeedCategory) => {
	return {
		[FeedCategory.MARKETS]: sideMarketsIcon(15),
		[FeedCategory.ANALYTICS]: sideAnalyticsIcon(15),
		[FeedCategory.PROJECTS]: sideProjectsIcon(15),
		[FeedCategory.POLICY]: sidePolicyIcon(15),
		[FeedCategory.SECURITY]: sideSecurityIcon(15),
		[FeedCategory.TECHNOLOGY]: sideTechnologyIcon(15),
		[FeedCategory.CULTURE]: sideCultureIcon(15),
		[FeedCategory.EDUCATION]: sideEducationIcon(18),
	}[category];
};

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
	icon?: ReactNode;
	name: ReactNode;
	rightButton?: {
		icon: ReactNode;
		onClick: () => void;
	};
}

export const SidebarButton = observer(({ look, href, icon, name, rightButton }: SidebarButtonProps) => {
	const location = useLocation();
	const navigate = useNav();

	const isActive = location.pathname === href;

	const lookClass =
		look &&
		{
			[SidebarButtonLook.SUBMENU]: css.sectionLink_submenu,
			[SidebarButtonLook.SECTION]: css.sectionLink_section,
		}[look];

	return (
		<a
			className={clsx(css.sectionLink, lookClass, isActive && css.sectionLink_active)}
			href={href}
			onClick={e => {
				e.preventDefault();
				isSidebarOpen.set(false);
				navigate(href);
			}}
		>
			{icon && <div className={css.sectionLinkIconLeft}>{icon}</div>}
			<div className={css.sectionLinkTitle}>{name}</div>

			{rightButton && (
				<ActionButton
					className={css.sectionRightButton}
					look={ActionButtonLook.LITE}
					icon={rightButton.icon}
					onClick={e => {
						e.preventDefault();
						e.stopPropagation();
						rightButton?.onClick();
					}}
				/>
			)}
		</a>
	);
});

//

export const SidebarMailSection = observer(() => {
	const openMailCompose = useOpenMailCompose();

	const accounts = useDomainAccounts();

	const [hasNewMessages, setHasNewMessages] = useState(false);

	useQuery(['mailbox', 'new-inbox-messages'], {
		queryFn: async () => {
			if (hasNewMessages) return;

			const data: Array<{ address: string; lastMessageDate?: number }> = await Promise.all(
				accounts.map(async account => {
					const mailList = new MailList();

					await mailList.init({
						mailbox: {
							accounts: [account],
							folderId: FolderId.Inbox,
						},
					});

					return {
						address: account.account.address,
						lastMessageDate: mailList.messages[0]?.msg.createdAt,
					};
				}),
			);

			const hasNew = data.some(d => {
				const lastCachedDate = browserStorage.lastMailboxIncomingDate[d.address];
				return lastCachedDate && d.lastMessageDate && lastCachedDate < d.lastMessageDate;
			});

			setHasNewMessages(hasNew);

			if (!hasNew) {
				browserStorage.lastMailboxIncomingDate = data.reduce((res, item) => {
					if (item.lastMessageDate) {
						res[item.address] = item.lastMessageDate;
					}

					return res;
				}, {} as Record<string, number>);
			}
		},
		refetchInterval: 60 * 1000,
	});

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
						Inbox
						{hasNewMessages && <div className={css.inboxNotification} title="You have new messages" />}
					</div>
				}
			/>

			<SidebarButton
				href={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent })}
				icon={<SentSvg />}
				name="Sent"
			/>

			<SidebarButton
				href={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive })}
				icon={<ArchiveSvg />}
				name="Archive"
			/>
		</SidebarSection>
	);
});

//

export const SidebarMenu = observer(() => {
	const [feedSettingsAccount, setFeedSettingsAccount] = useState<DomainAccount>();

	function renderOtcSection() {
		if (REACT_APP__APP_MODE !== AppMode.OTC) return;

		return (
			<SidebarSection section={Section.OTC} title="OTC Trading">
				<SidebarButton href={generatePath(RoutePath.OTC_ASSETS)} icon={<InboxSvg />} name="Asset Explorer" />

				<SidebarButton href={generatePath(RoutePath.OTC_CHATS)} icon={<SentSvg />} name="Chats" />
			</SidebarSection>
		);
	}

	function renderSmartFeedSection() {
		if (REACT_APP__APP_MODE !== AppMode.MAIN_VIEW) return;

		return (
			<SidebarSection section={Section.FEED} title="Feed">
				<SidebarButton href={generatePath(RoutePath.FEED_SMART)} icon={sideFeedIcon(14)} name="Smart feed" />

				{domain.accounts.activeAccounts.map((account, i) => (
					<SidebarButton
						key={i}
						look={SidebarButtonLook.SUBMENU}
						href={generatePath(RoutePath.FEED_SMART_ADDRESS, { address: account.account.address })}
						icon={<ContactSvg />}
						name={<AdaptiveText text={account.name || account.account.address} />}
						rightButton={
							REACT_APP__APP_MODE === AppMode.MAIN_VIEW
								? {
										icon: <SettingsSvg />,
										onClick: () => {
											if (!account.mainViewKey) {
												return toast('Please complete the onboarding first ❤');
											}

											setFeedSettingsAccount(account);
										},
								  }
								: undefined
						}
					/>
				))}

				{feedSettingsAccount && (
					<FeedSettingsPopup
						account={feedSettingsAccount}
						onClose={() => setFeedSettingsAccount(undefined)}
					/>
				)}
			</SidebarSection>
		);
	}

	function renderVenomProjectsSection() {
		if (REACT_APP__APP_MODE !== AppMode.HUB) return;

		return (
			<SidebarSection section={Section.VENOM_PROJECTS} title="Venom Projects">
				{[
					VenomProjectId.VENOM_BLOCKCHAIN,
					VenomProjectId.SNIPA,
					VenomProjectId.WEB3_WORLD,
					VenomProjectId.VENOM_BRIDGE,
					VenomProjectId.OASIS_GALLERY,
					VenomProjectId.VENTORY,
					VenomProjectId.YLIDE,
				].map(id => {
					const meta = venomProjectsMeta[id];

					return (
						<SidebarButton
							key={id}
							href={generatePath(RoutePath.FEED_VENOM_PROJECT, { project: meta.id })}
							name={meta.name}
							icon={meta.logo}
						/>
					);
				})}
			</SidebarSection>
		);
	}

	function renderFeedDiscoverySection() {
		if (REACT_APP__APP_MODE !== AppMode.MAIN_VIEW) return;

		return (
			<SidebarSection
				section={Section.FEED_DISCOVERY}
				title={REACT_APP__APP_MODE === AppMode.MAIN_VIEW ? 'Discovery' : 'Feed'}
			>
				<SidebarButton href={generatePath(RoutePath.FEED_ALL)} icon={sideFeedIcon(14)} name="All topics" />

				{Object.values<FeedCategory>(FeedCategory)
					.filter(c => c !== FeedCategory.POLICY && c !== FeedCategory.EDUCATION)
					.map(category => (
						<SidebarButton
							key={category}
							href={generatePath(RoutePath.FEED_CATEGORY, { category })}
							icon={getFeedCategoryIcon(category)}
							name={getFeedCategoryName(category)}
						/>
					))}
			</SidebarSection>
		);
	}

	function renderMailSection() {
		if (REACT_APP__APP_MODE !== AppMode.HUB) return;

		return <SidebarMailSection />;
	}

	return (
		<div className={css.root}>
			{renderOtcSection()}
			{renderSmartFeedSection()}
			{renderVenomProjectsSection()}
			{renderFeedDiscoverySection()}
			{renderMailSection()}

			<div className={css.socials}>
				<a
					href="https://t.me/ylide_chat"
					target="_blank noreferrer"
					title="Telegram"
					onClick={() => analytics.openSocial('telegram')}
				>
					<TelegramSvg />
				</a>

				<a
					href="https://discord.gg/ylide"
					target="_blank noreferrer"
					title="Discord"
					onClick={() => analytics.openSocial('discord')}
				>
					<DiscordSvg />
				</a>

				<a
					href="https://twitter.com/ylide_"
					target="_blank noreferrer"
					title="Twitter"
					onClick={() => analytics.openSocial('twitter')}
				>
					<TwitterSvg />
				</a>

				<a
					href="https://www.linkedin.com/company/ylide/"
					target="_blank noreferrer"
					title="LinkedIn"
					onClick={() => analytics.openSocial('linkedin')}
				>
					<LinkedInSvg />
				</a>

				<a
					href="https://medium.com/@ylide"
					target="_blank noreferrer"
					title="Medium"
					onClick={() => analytics.openSocial('medium')}
				>
					<MediumSvg />
				</a>
			</div>
		</div>
	);
});
