import React, { useEffect } from 'react';
import GenericLayout from '../../layouts/GenericLayout';
import MailboxList from './components/MailboxList';
import { MailboxHeader } from './components/MailboxHeader';

import mailList from '../../stores/MailList';
import { useParams } from 'react-router-dom';

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
