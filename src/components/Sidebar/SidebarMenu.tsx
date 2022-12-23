import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react';
import modals from '../../stores/Modals';
import { useWindowSize } from '../../utils/useWindowSize';
import { CaretDown } from '../../icons/CaretDown';
import { topicSettingsIcon } from '../../icons/static/topicSettingsIcon';
import { CaretUp } from '../../icons/CaretUp';
import { Button, Dropdown } from 'antd';
import { checkboxCheckIcon } from '../../icons/static/checkboxCheckIcon';
import { YlideButton } from '../../controls/YlideButton';
import feed from '../../stores/Feed';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { sideFeedIcon } from '../../icons/static/sideFeedIcon';
import { sideAllTopicsIcon } from '../../icons/static/sideAllTopicsIcon';
import { sideMarketsIcon } from '../../icons/static/sideMarketsIcon';
import { sideAnalyticsIcon } from '../../icons/static/sideAnalyticsIcon';
import { sideProjectsIcon } from '../../icons/static/sideProjectsIcon';
import { sidePolicyIcon } from '../../icons/static/sidePolicyIcon';
import { sideSecurityIcon } from '../../icons/static/sideSecurityIcon';
import { sideTechnologyIcon } from '../../icons/static/sideTechnologyIcon';
import { sideCultureIcon } from '../../icons/static/sideCultureIcon';
import { sideEducationIcon } from '../../icons/static/sideEducationIcon';
import clsx from 'clsx';

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
							feed.loadCategory('main');
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
	const navigate = useNavigate();
	const { windowWidth } = useWindowSize();
	const [feedOpen, setFeedOpen] = useState<boolean>(JSON.parse(localStorage.getItem('tv1_feedOpen') || 'true'));
	const [mailOpen, setMailOpen] = useState<boolean>(JSON.parse(localStorage.getItem('tv1_mailOpen') || 'true'));

	useEffect(() => {
		localStorage.setItem('tv1_feedOpen', JSON.stringify(feedOpen));
	}, [feedOpen]);

	useEffect(() => {
		localStorage.setItem('tv1_mailOpen', JSON.stringify(mailOpen));
	}, [mailOpen]);

	return (
		<div className={clsx('side-block', { open: modals.sidebarOpen })}>
			<div className="sidebar-container">
				{windowWidth < 920 ? (
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
				) : null}
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
								navigate('/compose');
							}}
						>
							Compose mail
						</div>
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/inbox' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/inbox');
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
							className={clsx('sidebar-section-link', { active: location.pathname === '/sent' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/sent');
							}}
						>
							<div className="sidebar-link-icon-left">
								<i className="fa fa-share" />
							</div>
							<div className="sidebar-link-title">Sent</div>
						</div>
						<div
							className={clsx('sidebar-section-link', { active: location.pathname === '/archive' })}
							onClick={() => {
								modals.sidebarOpen = false;
								navigate('/archive');
							}}
						>
							<div className="sidebar-link-icon-left">
								<i className="fa fa-trash-o" />
							</div>
							<div className="sidebar-link-title">Archive</div>
						</div>
					</div>
				</div>
				{/* {windowWidth < 920 ? (
					<div className="sidebar-mobile-header">
						<div className="header-burger">
							<Button
								onClick={() => {
									modals.sidebarOpen = !modals.sidebarOpen;
								}}
								icon={modals.sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
							/>
						</div>
					</div>
				) : null}
				{windowWidth < 920 ? null : <LinkButton text={linkButtonProps.text} link={linkButtonProps.link} />}
				<div className="sidebar-block">
					<h5 className="tag-list-title">Default folders</h5>
					<PermanentTagList />
				</div>
				<div className="sidebar-block">
					<h5 className="tag-list-title">Folders</h5>
					<TagsList />
				</div> */}
			</div>
		</div>
	);
});

export default SidebarMenu;
