import React from 'react';
import MainLayout from '../../layouts/mainLayout';
import MailsList from './components/MailsList';
import MailsCounter from './components/MailsCounter';
import MailsSearcher from './components/MailsSearcher';
import MailsListTooltips from './components/MailsListTooltips';

const MailboxPage = () => {
	return (
		<MainLayout>
			<div className="col-lg-10 animated fadeInRight">
				<div className="mail-box-header">
					{/* <MailsSearcher /> */}
					<MailsCounter />
					<MailsListTooltips />
				</div>
				<MailsList />
			</div>
		</MainLayout>
	);
};

export default MailboxPage;
