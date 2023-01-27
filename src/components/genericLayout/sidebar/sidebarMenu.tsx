import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { generatePath, useLocation } from 'react-router-dom';

import { YlideButton } from '../../../controls/YlideButton';
import { CaretDown } from '../../../icons/CaretDown';
import { CaretUp } from '../../../icons/CaretUp';
import { ReactComponent as DiscordSvg } from '../../../icons/social/discord.svg';
import { ReactComponent as LinkedInSvg } from '../../../icons/social/linkedIn.svg';
import { ReactComponent as MediumSvg } from '../../../icons/social/medium.svg';
import { ReactComponent as TelegramSvg } from '../../../icons/social/telegram.svg';
import { ReactComponent as TwitterSvg } from '../../../icons/social/twitter.svg';
import { checkboxCheckIcon } from '../../../icons/static/checkboxCheckIcon';
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
import { topicSettingsIcon } from '../../../icons/static/topicSettingsIcon';
import feed, { FeedCategory, getFeedCategoryName, nonSyntheticFeedCategories } from '../../../stores/Feed';
import { FolderId } from '../../../stores/MailList';
import modals from '../../../stores/Modals';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/navigate';
import css from './sidebarMenu.module.scss';

const FeedSettings = observer(() => {
	const [newValues, setNewValues] = useState(feed.mainCategories);

	useEffect(() => {
		setNewValues(feed.mainCategories);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [feed.mainCategories]);

	return (
		<div className="feed-settings-popup">
			<div className="fsp-title">My feed settings</div>

			{nonSyntheticFeedCategories.map(category => (
				<div key={category} className="fsp-row">
					<div
						onClick={() => {
							if (newValues.includes(category)) {
								setNewValues(newValues.filter(t => t !== category));
							} else {
								setNewValues([...newValues, category]);
							}
						}}
						className={clsx('fsp-checkbox', { checked: newValues.includes(category) })}
					>
						{newValues.includes(category) ? checkboxCheckIcon : null}
					</div>
					<div className="fsp-row-title">{getFeedCategoryName(category)}</div>
				</div>
			))}

			<div className="fsp-row" style={{ justifyContent: 'space-evenly', marginTop: 8 }}>
				<YlideButton
					nice
					size="small"
					onClick={() => {
						feed.mainCategories = [...newValues];
						localStorage.setItem('t_main_categories', JSON.stringify(feed.mainCategories));
						if (feed.selectedCategory === FeedCategory.MAIN) {
							feed.loadCategory(FeedCategory.MAIN, null);
						}
					}}
				>
					Save changes
				</YlideButton>
				<YlideButton
					ghost
					size="small"
					onClick={e => {
						setNewValues(feed.mainCategories);
					}}
				>
					Cancel
				</YlideButton>
			</div>
		</div>
	);
});

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

	return (
		<div className={clsx(css.root, { [css.root_open]: modals.sidebarOpen })}>
			<div className={css.container}>
				<div className="sidebar-mobile-header" style={{ alignSelf: 'center', marginBottom: 30 }}>
					<div className="header-burger" style={{ marginRight: 0 }}>
						<Button
							onClick={() => {
								modals.sidebarOpen = !modals.sidebarOpen;
							}}
							style={{ borderRadius: 8 }}
							icon={modals.sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
						>
							Hide sidebar
						</Button>
					</div>
				</div>

				<div className="sidebar-section">
					<div className="sidebar-section-title">
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
					<div className={clsx('sidebar-section-content', { open: feedOpen })}>
						{feedMenuItems.map(item => {
							const path = generatePath(RoutePath.FEED_CATEGORY, { category: item.category });

							return (
								<div
									key={item.category}
									className={clsx('sidebar-section-link', {
										active: location.pathname === path,
									})}
									onClick={() => {
										modals.sidebarOpen = false;
										navigate(path);
									}}
								>
									<div className="sidebar-link-icon-left">{item.icon}</div>
									<div className="sidebar-link-title">{getFeedCategoryName(item.category)}</div>

									{item.category === FeedCategory.MAIN && (
										<div className="sidebar-link-icon-right">
											<Dropdown overlay={<FeedSettings />}>{topicSettingsIcon}</Dropdown>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<div className="sidebar-section">
					<div className="sidebar-section-title">
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
					<div className={clsx('sidebar-section-content', { open: mailOpen })}>
						<div
							className="sidebar-section-button"
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(RoutePath.MAIL_COMPOSE);
							}}
						>
							Compose mail
						</div>
						<div
							className={clsx('sidebar-section-link', {
								active:
									location.pathname ===
									generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox }),
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox }));
							}}
						>
							<div className="sidebar-link-icon-left">
								<i className="fa fa-inbox" />
							</div>
							<div className="sidebar-link-title">Inbox</div>
							<div className="sidebar-link-icon-right">
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
							className={clsx('sidebar-section-link', {
								active:
									location.pathname ===
									generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent }),
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent }));
							}}
						>
							<div className="sidebar-link-icon-left">
								<i className="fa fa-share" />
							</div>
							<div className="sidebar-link-title">Sent</div>
						</div>
						<div
							className={clsx('sidebar-section-link', {
								active:
									location.pathname ===
									generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive }),
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive }));
							}}
						>
							<div className="sidebar-link-icon-left">
								<i className="fa fa-trash-o" />
							</div>
							<div className="sidebar-link-title">Archive</div>
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
