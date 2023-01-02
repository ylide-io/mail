import { observer } from 'mobx-react';
import React from 'react';

import MailboxEditor from './MailboxEditor/MailboxEditor';

const ComposeMailBody = observer(() => {
	return (
		<div className="mail-text">
			<MailboxEditor />
		</div>
	);
});

export default ComposeMailBody;
