import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { GenericLayout } from '../../layouts/GenericLayout';
import mailList from '../../stores/MailList';
import { MailboxHeader } from './components/MailboxHeader';
import MailboxList from './components/MailboxList';

export const MailboxPage = () => {
	const { folderId } = useParams();

	useEffect(() => {
		mailList.openFolder(folderId!);
	}, [folderId]);

	return (
		<GenericLayout>
			<div className="mailbox-page animated fadeInRight">
				<MailboxHeader />
				<MailboxList />
			</div>
		</GenericLayout>
	);
};
