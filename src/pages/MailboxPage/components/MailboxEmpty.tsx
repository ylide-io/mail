import { observer } from 'mobx-react';
import ClickToCopy from '../../../controls/ClickToCopy';
import domain from '../../../stores/Domain';

const MailboxEmpty = observer(() => {
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
			<h3>Your mailbox is empty yet.</h3>
			<div style={{ marginTop: 6 }}>
				<span>Share your addresses: </span>
				{domain.accounts.activeAccounts.map(acc => (
					<div>
						<ClickToCopy dataToCopy={acc.account.address}>{acc.account.address}</ClickToCopy>
					</div>
				))}

				<span> with your friends to receive the first one!</span>
			</div>
		</div>
	);
});

export default MailboxEmpty;
