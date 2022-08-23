import React, { useEffect } from 'react';
import MailboxMail from './MailboxMail/MailboxMail';
import mailer from '../../../stores/Mailer';
import { observer } from 'mobx-react';
import MailboxEmpty from './MailboxEmpty';

const MailsList = observer(() => {
	useEffect(() => {
		//
	}, []);

	return (
		<div className="mail-box">
			{mailer.inboxMessages.length ? (
				<table className="table table-hover table-mail">
					<tbody>
						{mailer.inboxMessages.map(msg => (
							<MailboxMail key={msg.link.msgId} message={msg} />
						))}
					</tbody>
				</table>
			) : (
				<>{!mailer.searchingText && !mailer.filteringMethod && <MailboxEmpty />}</>
			)}
		</div>
	);
});

export default MailsList;
