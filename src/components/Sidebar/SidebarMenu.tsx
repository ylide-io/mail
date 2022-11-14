import React, { useMemo } from 'react';
import LinkButton from './LinkButton';
import TagsList from './Categories/TagsList';
import { useLocation } from 'react-router-dom';
import PermanentTagList from './Categories/PermanentTagList';
import mailList from '../../stores/MailList';
import { observer } from 'mobx-react';

const SidebarMenu = observer(() => {
	const location = useLocation();

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
		<div className="side-block">
			<div className="sidebar-container">
				<LinkButton text={linkButtonProps.text} link={linkButtonProps.link} />
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
