import React, { useMemo } from 'react';
import LinkButton from './LinkButton';
import TagsList from './Categories/TagsList';
import { useLocation } from 'react-router-dom';
import mailer from '../../stores/Mailer';
import { useNav } from '../../utils/navigate';
import PermanentTag from './Categories/PermanentTag';
import PermanentTagList from './Categories/PermanentTagList';

const SidebarMenu = () => {
	const location = useLocation();
	const navigate = useNav();

	const linkButtonProps = useMemo(() => {
		if (location.pathname === '/mailbox') {
			return {
				text: 'Compose Mail',
				link: '/compose',
			};
		} else {
			return {
				text: 'Return to Mailbox',
				link: '/mailbox',
			};
		}
	}, [location]);

	const viewFolder = (folder: 'Inbox' | 'Archive') => {
		if (location.pathname !== 'mailbox') {
			navigate('/mailbox');
		}
		// if (folder === "Inbox") {
		//     mailer.filterByFolder(null)
		// } else {
		//     mailer.filterByArchived()
		// }
	};

	return (
		<div className="sidebar">
			<div className="ibox ">
				<div className="ibox-content mailbox-content">
					<div className="file-manager">
						<LinkButton text={linkButtonProps.text} link={linkButtonProps.link} />
						<div className="space-25"></div>
						<h5>Default folders</h5>
						<PermanentTagList viewFolder={viewFolder} />
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
