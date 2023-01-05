import { observer } from 'mobx-react';

import { AdaptiveAddress } from '../../../controls/AdaptiveAddress';
import contacts from '../../../stores/Contacts';
import mailList from '../../../stores/MailList';
import MailboxControls from './MailboxControls';

export const MailboxHeader = observer(() => {
	const contact = mailList.filterBySender ? contacts.contactsByAddress[mailList.filterBySender] : null;

	return (
		<div className="mailbox-header">
			{/* <MailsSearcher /> */}

			<div className="mailbox-title">
				{mailList.activeFolderId ? (
					<>
						{mailList.getFolderName(mailList.activeFolderId)}

						<div className="mailbox-title-secondary">
							{!!mailList.filterBySender && (
								<>
									{'from '}
									{contact ? contact.name : <AdaptiveAddress address={mailList.filterBySender} />}
								</>
							)}
						</div>
					</>
				) : (
					'Loading...'
				)}
			</div>

			<MailboxControls />
		</div>
	);
});
