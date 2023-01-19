import React from 'react';
import { generatePath } from 'react-router-dom';

import { RoutePath } from '../../stores/routePath';
import { useNav } from '../../utils/navigate';

const TagsEmpty = () => {
	const navigate = useNav();

	const gotoFolders = () => {
		navigate(generatePath(RoutePath.MAIL_FOLDERS));
	};

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				flexDirection: 'column',
				alignItems: 'center',
				paddingTop: '20px',
			}}
		>
			<span style={{ textAlign: 'center' }}>
				You haven't created any folders yet.{' '}
				<span onClick={gotoFolders} style={{ cursor: 'pointer', color: '#1ab394', fontWeight: 'bold' }}>
					Create
				</span>
			</span>
		</div>
	);
};

export default TagsEmpty;
