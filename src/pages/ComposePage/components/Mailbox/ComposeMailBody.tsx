import React from 'react';
import MailboxEditor from './MailboxEditor/MailboxEditor';
import { observer } from 'mobx-react';

const ComposeMailBody = observer(() => {
	return (
		<div className="mail-text">
			<MailboxEditor />
		</div>
	);
});

export default ComposeMailBody;
