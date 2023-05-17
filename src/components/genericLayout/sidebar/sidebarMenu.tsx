import clsx from 'clsx';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { PropsWithChildren, ReactNode, useState } from 'react';
import { generatePath, useLocation } from 'react-router-dom';

import { FeedCategory } from '../../../api/feedServerApi';
import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArchiveSvg } from '../../../icons/archive.svg';
import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { ReactComponent as SidebarMenuSvg } from '../../../icons/ic28/sidebarMenu.svg';
import { ReactComponent as SidebarMenuCloseSvg } from '../../../icons/ic28/sidebarMenu_close.svg';
import { ReactComponent as InboxSvg } from '../../../icons/inbox.svg';
import { ReactComponent as SentSvg } from '../../../icons/sent.svg';
import { ReactComponent as DiscordSvg } from '../../../icons/social/discord.svg';
import { ReactComponent as LinkedInSvg } from '../../../icons/social/linkedIn.svg';
import { ReactComponent as MediumSvg } from '../../../icons/social/medium.svg';
import { ReactComponent as TelegramSvg } from '../../../icons/social/telegram.svg';
import { ReactComponent as TwitterSvg } from '../../../icons/social/twitter.svg';
import { sideAllTopicsIcon } from '../../../icons/static/sideAllTopicsIcon';
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
import { WidgetId } from '../../../pages/widgets/widgets';
import { browserStorage } from '../../../stores/browserStorage';
import domain from '../../../stores/Domain';
import { getFeedCategoryName, nonSyntheticFeedCategories } from '../../../stores/Feed';
import { FolderId } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { useOpenMailCopmpose } from '../../../utils/mail';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AdaptiveText } from '../../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../../props';
import css from './sidebarMenu.module.scss';

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

interface SidebarButtonProps {
	isSubmenu?: boolean;
	href: string;
	icon: ReactNode;
	name: ReactNode;
	rightButton?: {
		icon: ReactNode;
		onClick: () => void;
	};
}

export const SidebarButton = observer(({ isSubmenu, href, icon, name, rightButton }: SidebarButtonProps) => {
	const location = useLocation();
	const navigate = useNav();

	const isActive = location.pathname === href;

	return (
		<a
			className={clsx(css.sectionLink, {
				[css.sectionLink_active]: isActive,
				[css.sectionLink_submenu]: isSubmenu,
			})}
			href={href}
			onClick={e => {
				e.preventDefault();
				navigate(href);
			}}
		>
			<div className={css.sectionLinkIconLeft}>{icon}</div>
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

export const isSidebarOpen = observable.box(false);

export enum Section {
	FEED = 'feed',
	FEED_DISCOVERY = 'feed_discovery',
	MAIL = 'mail',
	OTC = 'otc',
}

const getFeedCategoryIcon = (category: FeedCategory) => {
	return {
		[FeedCategory.MAIN]: sideFeedIcon(14),
		[FeedCategory.ALL]: sideAllTopicsIcon(15),
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

export const SidebarMenu = observer(() => {
	const openMailCopmpose = useOpenMailCopmpose();

	const [isFeedSettingsOpen, setFeedSettingsOpen] = useState(false);

	function renderOtcSection() {
		return (
			<SidebarSection section={Section.OTC} title="OTC Trading">
				<SidebarButton href={generatePath(RoutePath.OTC_ASSETS)} icon={<InboxSvg />} name="Asset Explorer" />

				<SidebarButton href={generatePath(RoutePath.OTC_CHATS)} icon={<SentSvg />} name="Chats" />
			</SidebarSection>
		);
	}

	function renderFeedSection() {
		return (
			<>
				<SidebarSection section={Section.FEED} title="Feed">
					<SidebarButton
						href={generatePath(RoutePath.FEED_SMART)}
						icon={getFeedCategoryIcon(FeedCategory.MAIN)}
						name={getFeedCategoryName(FeedCategory.MAIN)}
					/>

					{domain.accounts.activeAccounts.map(account => (
						<SidebarButton
							isSubmenu
							href={generatePath(RoutePath.FEED_SMART_ADDRESS, { address: account.account.address })}
							icon={<ContactSvg />}
							name={<AdaptiveText text={account.account.address} />}
						/>
					))}
				</SidebarSection>

				<SidebarSection section={Section.FEED_DISCOVERY} title="Discovery">
					{nonSyntheticFeedCategories.map(category => (
						<SidebarButton
							href={generatePath(RoutePath.FEED_CATEGORY, { category })}
							icon={getFeedCategoryIcon(category)}
							name={getFeedCategoryName(category)}
						/>
					))}

					{isFeedSettingsOpen && <FeedSettingsPopup onClose={() => setFeedSettingsOpen(false)} />}
				</SidebarSection>
			</>
		);
	}

	function renderMailSection() {
		return (
			<SidebarSection section={Section.MAIL} title="Mail">
				<ActionButton
					look={ActionButtonLook.PRIMARY}
					className={css.sectionButton}
					onClick={() => {
						isSidebarOpen.set(false);
						openMailCopmpose();
					}}
				>
					Compose mail
				</ActionButton>

				<SidebarButton
					href={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox })}
					icon={<InboxSvg />}
					name="Inbox"
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
	}

	return (
		<div className={css.root}>
			{REACT_APP__APP_MODE === AppMode.OTC ? (
				renderOtcSection()
			) : REACT_APP__APP_MODE === AppMode.MAIN_VIEW ? (
				renderFeedSection()
			) : (
				<>
					{browserStorage.widgetId !== WidgetId.MAILBOX && renderFeedSection()}

					{renderMailSection()}
				</>
			)}

			<div className={css.socials}>
				<a href="https://t.me/ylide_chat" target="_blank noreferrer" title="Telegram">
					<TelegramSvg />
				</a>
				<a href="https://discord.gg/ylide" target="_blank noreferrer" title="Discord">
					<DiscordSvg />
				</a>
				<a href="https://twitter.com/ylide_" target="_blank noreferrer" title="Twitter">
					<TwitterSvg />
				</a>
				<a href="https://www.linkedin.com/company/ylide/" target="_blank noreferrer" title="LinkedIn">
					<LinkedInSvg />
				</a>
				<a href="https://medium.com/@ylide" target="_blank noreferrer" title="Medium">
					<MediumSvg />
				</a>
			</div>
		</div>
	);
});
