import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { YlideButton } from '../../controls/YlideButton';
import { CaretDown } from '../../icons/CaretDown';
import { CaretUp } from '../../icons/CaretUp';
import { ReactComponent as DiscordSvg } from '../../icons/social/discord.svg';
import { ReactComponent as LinkedInSvg } from '../../icons/social/linkedIn.svg';
import { ReactComponent as MediumSvg } from '../../icons/social/medium.svg';
import { ReactComponent as TelegramSvg } from '../../icons/social/telegram.svg';
import { ReactComponent as TwitterSvg } from '../../icons/social/twitter.svg';
import { checkboxCheckIcon } from '../../icons/static/checkboxCheckIcon';
import { sideAllTopicsIcon } from '../../icons/static/sideAllTopicsIcon';
import { sideAnalyticsIcon } from '../../icons/static/sideAnalyticsIcon';
import { sideCultureIcon } from '../../icons/static/sideCultureIcon';
import { sideEducationIcon } from '../../icons/static/sideEducationIcon';
import { sideFeedIcon } from '../../icons/static/sideFeedIcon';
import { sideMarketsIcon } from '../../icons/static/sideMarketsIcon';
import { sidePolicyIcon } from '../../icons/static/sidePolicyIcon';
import { sideProjectsIcon } from '../../icons/static/sideProjectsIcon';
import { sideSecurityIcon } from '../../icons/static/sideSecurityIcon';
import { sideTechnologyIcon } from '../../icons/static/sideTechnologyIcon';
import { topicSettingsIcon } from '../../icons/static/topicSettingsIcon';
import feed from '../../stores/Feed';
import { FolderId } from '../../stores/MailList';
import modals from '../../stores/Modals';
import { useNav } from '../../utils/navigate';
import css from './SidebarMenu.module.scss';

const FeedSettings = observer(() => {
	const [newValues, setNewValues] = useState(feed.mainCategories);

	useEffect(() => {
		setNewValues(feed.mainCategories);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [feed.mainCategories]);

	return (
		<div className="feed-settings-popup">
			<div className="fsp-title">My feed settings</div>
			<div className="fsp-row">
				<div
					onClick={() => {
						if (newValues.includes('Markets')) {
							setNewValues(newValues.filter(t => t !== 'Markets'));
						} else {
							setNewValues([...newValues, 'Markets']);
						}
					}}
					className={clsx('fsp-checkbox', { checked: newValues.includes('Markets') })}
				>
					{newValues.includes('Markets') ? checkboxCheckIcon : null}
				</div>
				<div className="fsp-row-title">Markets</div>
			</div>
			<div className="fsp-row">
				<div
					onClick={() => {
						if (newValues.includes('Analytics')) {
							setNewValues(newValues.filter(t => t !== 'Analytics'));
						} else {
							setNewValues([...newValues, 'Analytics']);
						}
					}}
					className={clsx('fsp-checkbox', { checked: newValues.includes('Analytics') })}
				>
					{newValues.includes('Analytics') ? checkboxCheckIcon : null}
				</div>
				<div className="fsp-row-title">Analytics</div>
			</div>
			<div className="fsp-row">
				<div
					onClick={() => {
						if (newValues.includes('Projects')) {
							setNewValues(newValues.filter(t => t !== 'Projects'));
						} else {
							setNewValues([...newValues, 'Projects']);
						}
					}}
					className={clsx('fsp-checkbox', { checked: newValues.includes('Projects') })}
				>
					{newValues.includes('Projects') ? checkboxCheckIcon : null}
				</div>
				<div className="fsp-row-title">Projects</div>
			</div>
			<div className="fsp-row">
				<div
					onClick={() => {
						if (newValues.includes('Policy')) {
							setNewValues(newValues.filter(t => t !== 'Policy'));
						} else {
							setNewValues([...newValues, 'Policy']);
						}
					}}
					className={clsx('fsp-checkbox', { checked: newValues.includes('Policy') })}
				>
					{newValues.includes('Policy') ? checkboxCheckIcon : null}
				</div>
				<div className="fsp-row-title">Policy</div>
			</div>
			<div className="fsp-row">
				<div
					onClick={() => {
						if (newValues.includes('Security')) {
							setNewValues(newValues.filter(t => t !== 'Security'));
						} else {
							setNewValues([...newValues, 'Security']);
						}
					}}
					className={clsx('fsp-checkbox', { checked: newValues.includes('Security') })}
				>
					{newValues.includes('Security') ? checkboxCheckIcon : null}
				</div>
				<div className="fsp-row-title">Security</div>
			</div>
			<div className="fsp-row">
				<div
					onClick={() => {
						if (newValues.includes('Technology')) {
							setNewValues(newValues.filter(t => t !== 'Technology'));
						} else {
							setNewValues([...newValues, 'Technology']);
						}
					}}
					className={clsx('fsp-checkbox', { checked: newValues.includes('Technology') })}
				>
					{newValues.includes('Technology') ? checkboxCheckIcon : null}
				</div>
				<div className="fsp-row-title">Technology</div>
			</div>
			<div className="fsp-row">
				<div
					onClick={() => {
						if (newValues.includes('Culture')) {
							setNewValues(newValues.filter(t => t !== 'Culture'));
						} else {
							setNewValues([...newValues, 'Culture']);
						}
					}}
					className={clsx('fsp-checkbox', { checked: newValues.includes('Culture') })}
				>
					{newValues.includes('Culture') ? checkboxCheckIcon : null}
				</div>
				<div className="fsp-row-title">Culture</div>
			</div>
			<div className="fsp-row">
				<div
					onClick={() => {
						if (newValues.includes('Education')) {
							setNewValues(newValues.filter(t => t !== 'Education'));
						} else {
							setNewValues([...newValues, 'Education']);
						}
					}}
					className={clsx('fsp-checkbox', { checked: newValues.includes('Education') })}
				>
					{newValues.includes('Education') ? checkboxCheckIcon : null}
				</div>
				<div className="fsp-row-title">Education</div>
			</div>

			<div className="fsp-row" style={{ justifyContent: 'space-evenly', marginTop: 8 }}>
				<YlideButton
					nice
					size="small"
					onClick={() => {
						feed.mainCategories = [...newValues];
						localStorage.setItem('t_main_categories', JSON.stringify(feed.mainCategories));
						if (feed.selectedCategory === 'main') {
							feed.loadCategory('main', null);
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
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/feed/main' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/main');
							}}
						>
							<div className="sidebar-link-icon-left">{sideFeedIcon(14)}</div>
							<div className="sidebar-link-title">My feed</div>
							<div className="sidebar-link-icon-right">
								<Dropdown overlay={<FeedSettings />}>{topicSettingsIcon}</Dropdown>
							</div>
						</div>
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/feed/all' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/all');
							}}
						>
							<div className="sidebar-link-icon-left">{sideAllTopicsIcon(15)}</div>
							<div className="sidebar-link-title">All topics</div>
						</div>
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/feed/Markets' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/Markets');
							}}
						>
							<div className="sidebar-link-icon-left">{sideMarketsIcon(15)}</div>
							<div className="sidebar-link-title">Markets</div>
						</div>
						<div
							className={clsx('sidebar-section-link', {
								active: location.pathname === '/feed/Analytics',
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/Analytics');
							}}
						>
							<div className="sidebar-link-icon-left">{sideAnalyticsIcon(15)}</div>
							<div className="sidebar-link-title">Analytics</div>
						</div>
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/feed/Projects' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/Projects');
							}}
						>
							<div className="sidebar-link-icon-left">{sideProjectsIcon(15)}</div>
							<div className="sidebar-link-title">Projects</div>
						</div>
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/feed/Policy' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/Policy');
							}}
						>
							<div className="sidebar-link-icon-left">{sidePolicyIcon(15)}</div>
							<div className="sidebar-link-title">Policy</div>
						</div>
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/feed/Security' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/Security');
							}}
						>
							<div className="sidebar-link-icon-left">{sideSecurityIcon(15)}</div>
							<div className="sidebar-link-title">Security</div>
						</div>
						<div
							className={clsx('sidebar-section-link', {
								active: location.pathname === '/feed/Technology',
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/Technology');
							}}
						>
							<div className="sidebar-link-icon-left">{sideTechnologyIcon(15)}</div>
							<div className="sidebar-link-title">Technology</div>
						</div>
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/feed/Culture' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/Culture');
							}}
						>
							<div className="sidebar-link-icon-left">{sideCultureIcon(15)}</div>
							<div className="sidebar-link-title">Culture</div>
						</div>
						<div
							className={clsx('sidebar-section-link', {
								active: location.pathname === '/feed/Education',
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/feed/Education');
							}}
						>
							<div className="sidebar-link-icon-left">{sideEducationIcon(18)}</div>
							<div className="sidebar-link-title">Education</div>
						</div>
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
								navigate('/mail/compose');
							}}
						>
							Compose mail
						</div>
						<div
							className={clsx('sidebar-section-link', {
								active: location.pathname === `/mail/${FolderId.Inbox}`,
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(`/mail/${FolderId.Inbox}`);
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
								active: location.pathname === `/mail/${FolderId.Sent}`,
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(`/mail/${FolderId.Sent}`);
							}}
						>
							<div className="sidebar-link-icon-left">
								<i className="fa fa-share" />
							</div>
							<div className="sidebar-link-title">Sent</div>
						</div>
						<div
							className={clsx('sidebar-section-link', {
								active: location.pathname === `/mail/${FolderId.Archive}`,
							})}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate(`/mail/${FolderId.Archive}`);
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
					<a href="https://discord.gg/XfKfKhbvHS" target="_blank noreferrer" title="Discord">
						<DiscordSvg />
					</a>
					<a href="https://twitter.com/ylideio" target="_blank noreferrer" title="Twitter">
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
