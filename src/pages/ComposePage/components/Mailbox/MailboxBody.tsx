import React from 'react';
import MailboxEditor from './MailboxEditor/MailboxEditor';
import { observer } from 'mobx-react';
import { MailMeta } from '../MailMeta';

const MailboxBody = observer(() => {
	return (
		<>
			<div className="mail-body">
				<MailMeta />
			</div>
			<div className="mail-text h-200">
				<MailboxEditor />
				<div className="clearfix"></div>
			</div>
		</>
	);
});

export default MailboxBody;
