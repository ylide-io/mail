import { observer } from 'mobx-react';
import React from 'react';

import { LinkButton, LinkButtonType } from '../../../components/Sidebar/LinkButton';
import ClickToCopy from '../../../controls/ClickToCopy';
import domain from '../../../stores/Domain';
import mailList from '../../../stores/MailList';

const MailboxEmpty = observer(() => {
	const activeFolderId = mailList.activeFolderId;

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				flexDirection: 'column',
				alignItems: 'center',
				padding: '100px 20px 150px',
			}}
		>
			{activeFolderId === 'inbox' ? (
				<>
					<h3>Your mailbox is empty yet.</h3>
					<div style={{ marginTop: 6 }}>
						<span>Share your addresses: </span>
						{domain.accounts.activeAccounts.map(acc => (
							<div>
								<ClickToCopy dataToCopy={acc.account.address}>{acc.account.address}</ClickToCopy>
							</div>
						))}

						<span> with your friends to receive the first message.</span>
					</div>
				</>
			) : activeFolderId === 'sent' ? (
				<>
					<h3 style={{ marginBottom: 16 }}>
						You haven't sent any message yet.
						<br />
						Send a message to your friend now.
					</h3>

					<LinkButton type={LinkButtonType.PRIMARY} text="Compose Mail" link="/compose" />
				</>
			) : (
				<h3>No messages here.</h3>
			)}
		</div>
	);
});

export default MailboxEmpty;
