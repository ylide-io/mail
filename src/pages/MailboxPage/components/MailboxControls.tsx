import { Tooltip } from 'antd';
import { observer } from 'mobx-react';

import { ActionButton, ActionButtonStyle } from '../../../components/ActionButton/ActionButton';
import { smallButtonIcons } from '../../../components/smallButton/smallButton';
import { YlideCheckbox } from '../../../controls/YlideCheckbox';
import mailList, { FolderId } from '../../../stores/MailList';
import { useNav } from '../../../utils/navigate';

const MailboxControls = observer(() => {
	const navigate = useNav();

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
				<ActionButton onClick={readHandler} icon={<i className={`fa ${smallButtonIcons.eye}`} />} />
			</Tooltip>

			{mailList.activeFolderId === FolderId.Archive && (
				<Tooltip title="Restore mails">
					<ActionButton onClick={restoreHandler} icon={<i className={`fa ${smallButtonIcons.restore}`} />} />
				</Tooltip>
			)}

			{mailList.activeFolderId !== FolderId.Sent && (
				<Tooltip title="Archive mails">
					<ActionButton onClick={deleteHandler} icon={<i className={`fa ${smallButtonIcons.trash}`} />} />
				</Tooltip>
			)}

			{!!mailList.filterBySender && (
				<ActionButton
					style={ActionButtonStyle.Primary}
					icon={<i className={`fa ${smallButtonIcons.cross}`} />}
					onClick={() => navigate({ search: {} })}
				>
					Clear filter
				</ActionButton>
			)}
		</div>
	);
});

export default MailboxControls;
