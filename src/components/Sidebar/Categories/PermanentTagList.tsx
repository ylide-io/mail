import { observer } from 'mobx-react';
import React from 'react';

import mailList, { FolderId } from '../../../stores/MailList';
import modals from '../../../stores/Modals';
import { useNav } from '../../../utils/navigate';
import PermanentTag from './PermanentTag';

interface PermanentTagListProps {}

const PermanentTagList: React.FC<PermanentTagListProps> = observer(() => {
	const navigate = useNav();

	return (
		<div className="tag-list">
			<PermanentTag
				active={mailList.activeFolderId === FolderId.Inbox}
				text={'Inbox'}
				onClick={() => {
					navigate(`/mail/${FolderId}`);
					modals.sidebarOpen = false;
				}}
			/>
			<PermanentTag
				active={mailList.activeFolderId === FolderId.Sent}
				text={'Sent'}
				onClick={() => {
					navigate(`/mail/${FolderId.Sent}`);
					modals.sidebarOpen = false;
				}}
			/>
			<PermanentTag
				active={mailList.activeFolderId === FolderId.Archive}
				text={'Archive'}
				onClick={() => {
					navigate(`/mail/${FolderId.Archive}`);
					modals.sidebarOpen = false;
				}}
			/>
		</div>
	);
});

export default PermanentTagList;
