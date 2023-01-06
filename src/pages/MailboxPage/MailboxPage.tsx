import React, { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { GenericLayout } from '../../layouts/GenericLayout';
import mailList, { FolderId } from '../../stores/MailList';
import { MailboxHeader } from './components/MailboxHeader';
import MailboxList from './components/MailboxList';

export const MailboxPage = () => {
	const { folderId } = useParams<{ folderId: FolderId }>();
	const { search } = useLocation();

	useEffect(() => {
		const searchParams = new URLSearchParams(search);
		mailList.filterBySender = searchParams.get('sender');

		mailList.openFolder(folderId!);
	}, [folderId, search]);

	return (
		<GenericLayout>
			<div className="mailbox-page animated fadeInRight">
				<MailboxHeader />
				<MailboxList />
			</div>
		</GenericLayout>
	);
};
