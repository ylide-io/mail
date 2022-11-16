import React from 'react';
import PermanentTag from './PermanentTag';
import { observer } from 'mobx-react';
import mailList from '../../../stores/MailList';
import { useNavigate } from 'react-router-dom';
import modals from '../../../stores/Modals';

interface PermanentTagListProps {}

const PermanentTagList: React.FC<PermanentTagListProps> = observer(() => {
	const navigate = useNavigate();

	return (
		<div className="tag-list">
			<PermanentTag
				active={mailList.activeFolderId === 'inbox'}
				text={'Inbox'}
				onClick={() => {
					navigate('/inbox');
					modals.sidebarOpen = false;
				}}
			/>
			<PermanentTag
				active={mailList.activeFolderId === 'sent'}
				text={'Sent'}
				onClick={() => {
					navigate('/sent');
					modals.sidebarOpen = false;
				}}
			/>
			<PermanentTag
				active={mailList.activeFolderId === 'archive'}
				text={'Archive'}
				onClick={() => {
					navigate('/archive');
					modals.sidebarOpen = false;
				}}
			/>
			{/* <PermanentTag active={false} text={"Archive"} onClick={() => viewFolder("Archive")} /> */}
		</div>
	);
});

export default PermanentTagList;
