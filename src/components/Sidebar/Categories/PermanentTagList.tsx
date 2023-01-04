import { observer } from 'mobx-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import mailList from '../../../stores/MailList';
import modals from '../../../stores/Modals';
import PermanentTag from './PermanentTag';

interface PermanentTagListProps {}

const PermanentTagList: React.FC<PermanentTagListProps> = observer(() => {
	const navigate = useNavigate();

	return (
		<div className="tag-list">
			<PermanentTag
				active={mailList.activeFolderId === 'inbox'}
				text={'Inbox'}
				onClick={() => {
					navigate('/mail/inbox');
					modals.sidebarOpen = false;
				}}
			/>
			<PermanentTag
				active={mailList.activeFolderId === 'sent'}
				text={'Sent'}
				onClick={() => {
					navigate('/mail/sent');
					modals.sidebarOpen = false;
				}}
			/>
			<PermanentTag
				active={mailList.activeFolderId === 'archive'}
				text={'Archive'}
				onClick={() => {
					navigate('/mail/archive');
					modals.sidebarOpen = false;
				}}
			/>
			{/* <PermanentTag active={false} text={"Archive"} onClick={() => viewFolder("Archive")} /> */}
		</div>
	);
});

export default PermanentTagList;
