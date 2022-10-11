import React, { useMemo } from 'react';
import LinkButton from './LinkButton';
import TagsList from './Categories/TagsList';
import { useLocation } from 'react-router-dom';
import PermanentTagList from './Categories/PermanentTagList';
import mailList from '../../stores/MailList';

const SidebarMenu = () => {
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
				link: `/${mailList.activeFolderId}`,
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location, mailList.activeFolderId]);

	return (
		<div className="sidebar">
			<div className="ibox ">
				<div className="ibox-content mailbox-content">
					<div className="file-manager">
						<LinkButton text={linkButtonProps.text} link={linkButtonProps.link} />
						<div className="space-25"></div>
						<h5>Default folders</h5>
						<PermanentTagList />
						<h5>Folders</h5>
						<TagsList />
						<div className="clearfix"></div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SidebarMenu;
