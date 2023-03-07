import { observer } from 'mobx-react';
import React from 'react';
import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import ClickToCopy from '../../../controls/ClickToCopy';
import domain from '../../../stores/Domain';
import { FolderId } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';

interface MailboxEmptyProps {
	folderId: FolderId;
}

const MailboxEmpty = observer(({ folderId }: MailboxEmptyProps) => {
	const navigate = useNav();

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
			{folderId === FolderId.Inbox ? (
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
			) : folderId === FolderId.Sent ? (
				<>
					<h3 style={{ marginBottom: 16 }}>
						You haven't sent any message yet.
						<br />
						Send a message to your friend now.
					</h3>

					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						onClick={() => navigate(generatePath(RoutePath.MAIL_COMPOSE))}
					>
						Compose Mail
					</ActionButton>
				</>
			) : (
				<h3>No messages here.</h3>
			)}
		</div>
	);
});

export default MailboxEmpty;
