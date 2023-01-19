import { observer } from 'mobx-react';
import React from 'react';
import { generatePath } from 'react-router-dom';

import { FolderId, useMailStore } from '../../../stores/MailList';
import modals from '../../../stores/Modals';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/navigate';
import PermanentTag from './PermanentTag';

interface PermanentTagListProps {}

const PermanentTagList: React.FC<PermanentTagListProps> = observer(() => {
	const navigate = useNav();
	const lastActiveFolderId = useMailStore(state => state.lastActiveFolderId);

	return (
		<div className="tag-list">
			<PermanentTag
				active={lastActiveFolderId === FolderId.Inbox}
				text={'Inbox'}
				onClick={() => {
					navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox }));
					modals.sidebarOpen = false;
				}}
			/>
			<PermanentTag
				active={lastActiveFolderId === FolderId.Sent}
				text={'Sent'}
				onClick={() => {
					navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Sent }));
					modals.sidebarOpen = false;
				}}
			/>
			<PermanentTag
				active={lastActiveFolderId === FolderId.Archive}
				text={'Archive'}
				onClick={() => {
					navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Archive }));
					modals.sidebarOpen = false;
				}}
			/>
		</div>
	);
});

export default PermanentTagList;
