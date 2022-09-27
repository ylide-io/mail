import React from 'react';
import MailboxEditor from './MailboxEditor/MailboxEditor';
import SubjectEditor from './SubjectEditor';
// import RecipientsEditor from "./RecipientsEditor";
import { RecipientsSelect } from '../../../../controls/RecipientSelect';
import mailbox from '../../../../stores/Mailbox';

const MailboxBody = () => {
	return (
		<>
			<div className="mail-body">
				<form method="get">
					<RecipientsSelect values={mailbox.recipients} onChange={e => (mailbox.recipients = e)} />
					{/* <RecipientsEditor /> */}
					<SubjectEditor />
				</form>
			</div>
			<div className="mail-text h-200">
				<MailboxEditor />
				<div className="clearfix"></div>
			</div>
		</>
	);
};

export default MailboxBody;
