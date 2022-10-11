import React, { useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import MailboxList from './components/MailboxList';
import { MailboxHeader } from './components/MailboxHeader';

import './style.scss';
import mailList from '../../stores/MailList';

const MailboxPage = () => {
	useEffect(() => {
		mailList.openFolder('inbox');
	}, []);

	return (
		<MainLayout>
			<div className="mailbox-page animated fadeInRight">
				<MailboxHeader />
				<MailboxList />
			</div>
		</MainLayout>
	);
};

export default MailboxPage;
