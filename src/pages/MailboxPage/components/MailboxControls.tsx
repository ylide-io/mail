import SmallButton, { smallButtonColors, smallButtonIcons } from '../../../components/smallButton/smallButton';
import { observer } from 'mobx-react';
import mailList from '../../../stores/MailList';

const MailboxControls = observer(() => {
	const readHandler = () => {
		mailList.markAsReaded();
	};

	const deleteHandler = () => {
		mailList.markAsDeleted();
	};

	const restoreHandler = () => {
		mailList.markAsNotDeleted();
	};

	// const pagesCount =
	// 	Math.floor(mailer.messageIds.length / mailer.messagesOnPage) +
	// 	(mailer.messageIds.length % mailer.messagesOnPage ? 1 : 0);
	// const isNextPageAvailable = domain.inbox.isNextPageAvailable;

	return (
		<div className="mail-tools tooltip-demo m-t-md">
			<div className="tooltip-buttons-space">
				<SmallButton
					onClick={readHandler}
					color={smallButtonColors.white}
					icon={smallButtonIcons.eye}
					title={'Mark as read'}
				/>
				{mailList.activeFolderId === 'archive' ? (
					<SmallButton
						onClick={restoreHandler}
						color={smallButtonColors.white}
						icon={smallButtonIcons.restore}
						title={'Restore mails'}
					/>
				) : mailList.activeFolderId === 'sent' ? null : (
					<SmallButton
						onClick={deleteHandler}
						color={smallButtonColors.white}
						icon={smallButtonIcons.trash}
						title={'Archive mails'}
					/>
				)}
			</div>
		</div>
	);
});

export default MailboxControls;
