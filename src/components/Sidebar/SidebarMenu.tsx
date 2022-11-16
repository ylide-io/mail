import React, { useMemo } from 'react';
import LinkButton from './LinkButton';
import TagsList from './Categories/TagsList';
import { useLocation } from 'react-router-dom';
import PermanentTagList from './Categories/PermanentTagList';
import mailList from '../../stores/MailList';
import { observer } from 'mobx-react';
import cn from 'classnames';
import modals from '../../stores/Modals';
import { useWindowSize } from '../../utils/useWindowSize';
import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const SidebarMenu = observer(() => {
	const location = useLocation();
	const { windowWidth } = useWindowSize();

	const linkButtonProps = useMemo(() => {
		if (location.pathname === '/' + mailList.activeFolderId) {
			return {
				text: 'Compose Mail',
				link: '/compose',
			};
		} else {
			return {
				text: 'Return to Mailbox',
				link: `/${mailList.activeFolderId || 'inbox'}`,
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location, mailList.activeFolderId]);

	return (
		<div className={cn('side-block', { open: modals.sidebarOpen })}>
			<div className="sidebar-container">
				{windowWidth < 920 ? (
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
				</div>
			</div>
		</div>
	);
});

export default SidebarMenu;
