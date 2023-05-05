import clsx from 'clsx';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { PropsWithChildren, ReactNode, useState } from 'react';
import { generatePath, useLocation } from 'react-router-dom';

import { REACT_APP__OTC_MODE, REACT_APP__SMART_FEED_MODE } from '../../../env';
import { ReactComponent as ArchiveSvg } from '../../../icons/archive.svg';
import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
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
import { FeedCategory, getFeedCategoryName } from '../../../stores/Feed';
import { FolderId } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { useOpenMailCopmpose } from '../../../utils/mail';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
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
	isActive?: boolean;
	icon: ReactNode;
	name: ReactNode;
	rightButton?: {
		icon: ReactNode;
		onClick: () => void;
	};
	onClick: () => void;
}

export const SidebarButton = observer(({ isActive, icon, name, rightButton, onClick }: SidebarButtonProps) => (
	<div
		className={clsx(css.sectionLink, {
			[css.sectionLink_active]: isActive,
		})}
		onClick={() => onClick()}
	>
		<div className={css.sectionLinkIconLeft}>{icon}</div>
		<div className={css.sectionLinkTitle}>{name}</div>

		{rightButton && (
			<ActionButton
				className={css.sectionRightButton}
				look={ActionButtonLook.LITE}
				icon={rightButton.icon}
				onClick={e => {
					e.stopPropagation();
					rightButton?.onClick();
				}}
			/>
		)}
	</div>
));

//

const isSidebarOpen = observable.box(false);

export enum Section {
	FEED = 'feed',
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
	const location = useLocation();
	const navigate = useNav();
	const openMailCopmpose = useOpenMailCopmpose();

	const [isFeedSettingsOpen, setFeedSettingsOpen] = useState(false);

	function renderOtcSection() {
		return (
			<SidebarSection section={Section.OTC} title="OTC Trading">
				<SidebarButton
					isActive={location.pathname === generatePath(RoutePath.OTC_ASSETS)}
					icon={<InboxSvg />}
					name="Asset Explorer"
					onClick={() => {
						isSidebarOpen.set(false);
						navigate(generatePath(RoutePath.OTC_ASSETS));
					}}
				/>

				<SidebarButton
					isActive={location.pathname === generatePath(RoutePath.OTC_CHATS)}
					icon={<SentSvg />}
					name="Chats"
					onClick={() => {
						isSidebarOpen.set(false);
						navigate(generatePath(RoutePath.OTC_CHATS));
					}}
				/>
			</SidebarSection>
		);
	}

	function renderFeedSection() {
		return (
			<SidebarSection section={Section.FEED} title="Feed">
				{Object.values(FeedCategory).map(category => {
					const path = generatePath(RoutePath.FEED_CATEGORY, { category });

					return (
						<SidebarButton
							isActive={location.pathname === path}
							icon={getFeedCategoryIcon(category)}
							name={getFeedCategoryName(category)}
							onClick={() => {
								isSidebarOpen.set(false);
								navigate(path);
							}}
							rightButton={
								category === FeedCategory.MAIN
									? {
											icon: <SettingsSvg />,
											onClick: () => setFeedSettingsOpen(!isFeedSettingsOpen),
									  }
									: undefined
							}
						/>
					);
				})}

				{isFeedSettingsOpen && <FeedSettingsPopup onClose={() => setFeedSettingsOpen(false)} />}
			</SidebarSection>
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
					isActive={location.pathname === generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox })}
					icon={<InboxSvg />}
					name="Inbox"
					onClick={() => {
						isSidebarOpen.set(false);
						navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox }));
					}}
				/>

				<SidebarButton
					isActive={location.pathname === generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent })}
					icon={<SentSvg />}
					name="Sent"
					onClick={() => {
						isSidebarOpen.set(false);
						navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent }));
					}}
				/>

				<SidebarButton
					isActive={location.pathname === generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive })}
					icon={<ArchiveSvg />}
					name="Archive"
					onClick={() => {
						isSidebarOpen.set(false);
						navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive }));
					}}
				/>
			</SidebarSection>
		);
	}

	return (
		<div className={clsx(css.root, { [css.root_open]: isSidebarOpen.get() })}>
			<div className={css.container}>
				<div className={css.mobileHeader}>
					<SidebarBurger>Hide sidebar</SidebarBurger>
				</div>

				{REACT_APP__OTC_MODE ? (
					renderOtcSection()
				) : REACT_APP__SMART_FEED_MODE ? (
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
		</div>
	);
});
