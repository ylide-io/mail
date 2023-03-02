import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { PropsWithChildren, useState } from 'react';
import { generatePath, useLocation } from 'react-router-dom';

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
import { browserStorage } from '../../../stores/browserStorage';
import { FeedCategory, getFeedCategoryName } from '../../../stores/Feed';
import { FolderId } from '../../../stores/MailList';
import modals from '../../../stores/Modals';
import { OutgoingMailData } from '../../../stores/outgoingMailData';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { useComposeMailPopup } from '../../composeMailPopup/composeMailPopup';
import { FeedSettingsPopup } from '../../feedSettingsPopup/feedSettingsPopup';
import { PropsWithClassName } from '../../propsWithClassName';
import css from './sidebarMenu.module.scss';

interface SidebarBurgerProps extends PropsWithClassName, PropsWithChildren {}

export function SidebarBurger({ className, children }: SidebarBurgerProps) {
	return (
		<div className={clsx(css.burger, className)}>
			<ActionButton
				size={ActionButtonSize.Medium}
				icon={modals.sidebarOpen ? <SidebarMenuCloseSvg /> : <SidebarMenuSvg />}
				onClick={() => {
					modals.sidebarOpen = !modals.sidebarOpen;
				}}
			>
				{children}
			</ActionButton>
		</div>
	);
}

//

export enum SidebarSection {
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

const SidebarMenu = observer(() => {
	const location = useLocation();
	const navigate = useNav();

	const [isFeedSettingsOpen, setFeedSettingsOpen] = useState(false);

	const composeMailPopup = useComposeMailPopup();

	return (
		<div className={clsx(css.root, { [css.root_open]: modals.sidebarOpen })}>
			<div className={css.container}>
				<div className={css.mobileHeader}>
					<SidebarBurger>Hide sidebar</SidebarBurger>
				</div>

				{/* <div className={css.section}>
					<div className={css.sectionTitle}>
						Feed
						<ActionButton
							look={ActionButtonLook.LITE}
							icon={
								browserStorage.isSidebarSectionFolded(SidebarSection.FEED) ? (
									<ArrowDownSvg />
								) : (
									<ArrowUpSvg />
								)
							}
							onClick={() => browserStorage.toggleSidebarSectionFolding(SidebarSection.FEED)}
						/>
					</div>

					<div
						className={clsx(
							css.sectionContent,
							browserStorage.isSidebarSectionFolded(SidebarSection.FEED) || css.sectionContent_open,
						)}
					>
						{Object.values(FeedCategory).map(category => {
							const path = generatePath(RoutePath.FEED_CATEGORY, { category });

							return (
								<div
									key={category}
									className={clsx(css.sectionLink, {
										[css.sectionLink_active]: location.pathname === path,
									})}
									onClick={() => {
										modals.sidebarOpen = false;
										navigate(path);
									}}
								>
									<div className={css.sectionLinkIconLeft}>{getFeedCategoryIcon(category)}</div>
									<div className={css.sectionLinkTitle}>{getFeedCategoryName(category)}</div>

									{category === FeedCategory.MAIN && (
										<>
											<ActionButton
												className={css.sectionRightButton}
												look={ActionButtonLook.LITE}
												icon={<SettingsSvg />}
												onClick={e => {
													e.stopPropagation();
													setFeedSettingsOpen(!isFeedSettingsOpen);
												}}
											/>

											{isFeedSettingsOpen && (
												<FeedSettingsPopup onClose={() => setFeedSettingsOpen(false)} />
											)}
										</>
									)}
								</div>
							);
						})}
					</div>
				</div> */}

				<div className={css.section}>
					<div className={css.sectionTitle}>
						OTC Trading
						<ActionButton
							look={ActionButtonLook.LITE}
							icon={
								browserStorage.isSidebarSectionFolded(SidebarSection.OTC) ? (
									<ArrowDownSvg />
								) : (
									<ArrowUpSvg />
								)
							}
							onClick={() => browserStorage.toggleSidebarSectionFolding(SidebarSection.OTC)}
						/>
					</div>
					<div
						className={clsx(
							css.sectionContent,
							browserStorage.isSidebarSectionFolded(SidebarSection.OTC) || css.sectionContent_open,
						)}
					>
						<div
							className={clsx(css.sectionLink, {
								[css.sectionLink_active]: location.pathname === generatePath(RoutePath.OTC_ASSETS),
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(generatePath(RoutePath.OTC_ASSETS));
							}}
						>
							<div className={css.sectionLinkIconLeft}>
								<InboxSvg />
							</div>
							<div className={css.sectionLinkTitle}>Asset Explorer</div>
						</div>
						<div
							className={clsx(css.sectionLink, {
								[css.sectionLink_active]: location.pathname === generatePath(RoutePath.OTC_CHATS),
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(generatePath(RoutePath.OTC_CHATS));
							}}
						>
							<div className={css.sectionLinkIconLeft}>
								<SentSvg />
							</div>
							<div className={css.sectionLinkTitle}>Chats</div>
						</div>
					</div>
				</div>

				{/* <div className={css.section}>
					<div className={css.sectionTitle}>
						Mail
						<ActionButton
							look={ActionButtonLook.LITE}
							icon={
								browserStorage.isSidebarSectionFolded(SidebarSection.MAIL) ? (
									<ArrowDownSvg />
								) : (
									<ArrowUpSvg />
								)
							}
							onClick={() => browserStorage.toggleSidebarSectionFolding(SidebarSection.MAIL)}
						/>
					</div>
					<div
						className={clsx(
							css.sectionContent,
							browserStorage.isSidebarSectionFolded(SidebarSection.MAIL) || css.sectionContent_open,
						)}
					>
						<ActionButton
							look={ActionButtonLook.PRIMARY}
							className={css.sectionButton}
							onClick={() => {
								modals.sidebarOpen = false;

								if (location.pathname !== generatePath(RoutePath.MAIL_COMPOSE)) {
									composeMailPopup({ mailData: new OutgoingMailData() });
								}
							}}
						>
							Compose mail
						</ActionButton>
						<div
							className={clsx(css.sectionLink, {
								[css.sectionLink_active]:
									location.pathname ===
									generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox }),
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox }));
							}}
						>
							<div className={css.sectionLinkIconLeft}>
								<InboxSvg />
							</div>
							<div className={css.sectionLinkTitle}>Inbox</div>
						</div>
						<div
							className={clsx(css.sectionLink, {
								[css.sectionLink_active]:
									location.pathname ===
									generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent }),
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent }));
							}}
						>
							<div className={css.sectionLinkIconLeft}>
								<SentSvg />
							</div>
							<div className={css.sectionLinkTitle}>Sent</div>
						</div>
						<div
							className={clsx(css.sectionLink, {
								[css.sectionLink_active]:
									location.pathname ===
									generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive }),
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive }));
							}}
						>
							<div className={css.sectionLinkIconLeft}>
								<ArchiveSvg />
							</div>
							<div className={css.sectionLinkTitle}>Archive</div>
						</div>
					</div>
				</div> */}

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

export default SidebarMenu;
