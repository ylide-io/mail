import { smallButtonColors, smallButtonIcons } from '../../../components/smallButton/smallButton';
import { observer } from 'mobx-react';
import mailList from '../../../stores/MailList';
import { Button, Tooltip } from 'antd';
import { YlideCheckbox } from '../../../controls/YlideCheckbox';

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

	const isAllSelected = mailList.messages.every(m => mailList.checkedMessageIds.includes(m.id));

	return (
		<div className="mailbox-tools">
			<Tooltip title={isAllSelected ? 'Deselect all' : 'Select all'}>
				<div className="global-checkbox-wrapper">
					<YlideCheckbox
						checked={isAllSelected}
						onCheck={value => {
							if (value) {
								mailList.checkedMessageIds = mailList.messages.map(m => m.id);
							} else {
								mailList.checkedMessageIds = [];
							}
						}}
					/>
				</div>
			</Tooltip>
			<Tooltip title="Mark as read">
				<Button
					size="small"
					type="dashed"
					onClick={readHandler}
					color={smallButtonColors.white}
					icon={<i className={`fa ${smallButtonIcons.eye}`} />}
				/>
			</Tooltip>
			{mailList.activeFolderId === 'archive' ? (
				<Tooltip title="Restore mails">
					<Button
						size="small"
						type="dashed"
						onClick={restoreHandler}
						color={smallButtonColors.white}
						icon={<i className={`fa ${smallButtonIcons.restore}`} />}
					/>
				</Tooltip>
			) : mailList.activeFolderId === 'sent' ? null : (
				<Tooltip title="Archive mails">
					<Button
						size="small"
						type="dashed"
						onClick={deleteHandler}
						color={smallButtonColors.white}
						icon={<i className={`fa ${smallButtonIcons.trash}`} />}
					/>
				</Tooltip>
			)}
		</div>
	);
});

export default MailboxControls;
