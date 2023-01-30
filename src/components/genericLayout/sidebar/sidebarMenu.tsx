import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { generatePath, useLocation } from 'react-router-dom';

import { CaretDown } from '../../../icons/CaretDown';
import { CaretUp } from '../../../icons/CaretUp';
import { ReactComponent as SettingsSvg } from '../../../icons/settings.svg';
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
import { FeedCategory, getFeedCategoryName } from '../../../stores/Feed';
import { FolderId } from '../../../stores/MailList';
import modals from '../../../stores/Modals';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/navigate';
import { PropsWithClassName } from '../../propsWithClassName';
import { FeedSettingsPopup } from './feedSettingsPopup/feedSettingsPopup';
import css from './sidebarMenu.module.scss';

interface SidebarBurgerProps extends PropsWithClassName, PropsWithChildren {}

export function SidebarBurger({ className, children }: SidebarBurgerProps) {
	return (
		<Button
			className={clsx(css.burger, className)}
			onClick={() => {
				modals.sidebarOpen = !modals.sidebarOpen;
			}}
			icon={modals.sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
		>
			{children}
		</Button>
	);
}

//

const feedMenuItems = [
	{
		category: FeedCategory.MAIN,
		icon: sideFeedIcon(14),
	},
	{
		category: FeedCategory.ALL,
		icon: sideAllTopicsIcon(15),
	},
	{
		category: FeedCategory.MARKETS,
		icon: sideMarketsIcon(15),
	},
	{
		category: FeedCategory.ANALYTICS,
		icon: sideAnalyticsIcon(15),
	},
	{
		category: FeedCategory.PROJECTS,
		icon: sideProjectsIcon(15),
	},
	{
		category: FeedCategory.POLICY,
		icon: sidePolicyIcon(15),
	},
	{
		category: FeedCategory.SECURITY,
		icon: sideSecurityIcon(15),
	},
	{
		category: FeedCategory.TECHNOLOGY,
		icon: sideTechnologyIcon(15),
	},
	{
		category: FeedCategory.CULTURE,
		icon: sideCultureIcon(15),
	},
	{
		category: FeedCategory.EDUCATION,
		icon: sideEducationIcon(18),
	},
];

const SidebarMenu = observer(() => {
	const location = useLocation();
	const navigate = useNav();
	const [feedOpen, setFeedOpen] = useState<boolean>(JSON.parse(localStorage.getItem('tv1_feedOpen') || 'true'));
	const [mailOpen, setMailOpen] = useState<boolean>(JSON.parse(localStorage.getItem('tv1_mailOpen') || 'true'));

	useEffect(() => {
		localStorage.setItem('tv1_feedOpen', JSON.stringify(feedOpen));
	}, [feedOpen]);

	useEffect(() => {
		localStorage.setItem('tv1_mailOpen', JSON.stringify(mailOpen));
	}, [mailOpen]);

	const feedSettingsButtonRef = useRef(null);
	const [isFeedSettingsOpen, setFeedSettingsOpen] = useState(false);

	return (
		<div className={clsx(css.root, { [css.root_open]: modals.sidebarOpen })}>
			<div className={css.container}>
				<div className={css.mobileHeader}>
					<SidebarBurger>Hide sidebar</SidebarBurger>
				</div>

				<div className={css.section}>
					<div className={css.sectionTitle}>
						Feed{' '}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
							}}
							onClick={() => setFeedOpen(v => !v)}
						>
							{feedOpen ? <CaretDown /> : <CaretUp />}
						</div>
					</div>

					<div className={clsx(css.sectionContent, feedOpen && css.sectionContent_open)}>
						{feedMenuItems.map(item => {
							const path = generatePath(RoutePath.FEED_CATEGORY, { category: item.category });

							return (
								<div
									key={item.category}
									className={clsx(css.sectionLink, {
										[css.sectionLink_active]: location.pathname === path,
									})}
									onClick={() => {
										modals.sidebarOpen = false;
										navigate(path);
									}}
								>
									<div className={css.sectionLinkIconLeft}>{item.icon}</div>
									<div className={css.sectionLinkTitle}>{getFeedCategoryName(item.category)}</div>

									{item.category === FeedCategory.MAIN && (
										<>
											<button
												ref={feedSettingsButtonRef}
												className={css.sectionLinkIconRight}
												onClick={e => {
													e.stopPropagation();
													setFeedSettingsOpen(!isFeedSettingsOpen);
												}}
											>
												<SettingsSvg />
											</button>

											{isFeedSettingsOpen && (
												<FeedSettingsPopup
													anchorRef={feedSettingsButtonRef}
													onClose={() => setFeedSettingsOpen(false)}
												/>
											)}
										</>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<div className={css.section}>
					<div className={css.sectionTitle}>
						Mail{' '}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
							}}
							onClick={() => setMailOpen(v => !v)}
						>
							{mailOpen ? <CaretDown /> : <CaretUp />}
						</div>
					</div>
					<div className={clsx(css.sectionContent, mailOpen && css.sectionContent_open)}>
						<div
							className={css.sectionButton}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(RoutePath.MAIL_COMPOSE);
							}}
						>
							Compose mail
						</div>
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
								<i className="fa fa-inbox" />
							</div>
							<div className={css.sectionLinkTitle}>Inbox</div>
							<div className={css.sectionLinkIconRight}>
								{/* <div
									style={{
										borderRadius: '50%',
										width: 18,
										height: 18,
										display: 'flex',
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center',
										background: 'transparent',
										border: '1px solid #404040',
										fontWeight: 'bold',
										color: 'red',
									}}
								>
									1
								</div> */}
							</div>
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
								<i className="fa fa-share" />
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
								<i className="fa fa-trash-o" />
							</div>
							<div className={css.sectionLinkTitle}>Archive</div>
						</div>
					</div>
				</div>

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
					<a
						href="src/components/genericLayout/sidebar/sidebarMenu"
						target="_blank noreferrer"
						title="LinkedIn"
					>
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
