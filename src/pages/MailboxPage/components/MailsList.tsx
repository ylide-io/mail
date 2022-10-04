import React, { useEffect } from 'react';
import MailboxMail from './MailboxMail/MailboxMail';
import mailer from '../../../stores/Mailer';
import { observer } from 'mobx-react';
import MailboxEmpty from './MailboxEmpty';
import mailList from '../../../stores/MailList';

const MailsList = observer(() => {
	useEffect(() => {
		//
	}, []);

	return (
		<div className="mail-box">
			{mailList.messages.length ? (
				<table className="table table-hover table-mail">
					<tbody>
						{mailList.messages.map(msg => (
							<MailboxMail key={msg.msgId} message={msg} />
						))}
					</tbody>
				</table>
			) : (
				'test'
				// <>{!mailer.searchingText && !mailer.filteringMethod && <MailboxEmpty />}</>
			)}
		</div>
	);
});

export default MailsList;
