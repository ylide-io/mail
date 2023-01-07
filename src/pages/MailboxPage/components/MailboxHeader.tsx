import { Tooltip } from 'antd';
import { observer } from 'mobx-react';

import { ActionButton, ActionButtonStyle } from '../../../components/ActionButton/ActionButton';
import { smallButtonIcons } from '../../../components/smallButton/smallButton';
import { AdaptiveAddress } from '../../../controls/AdaptiveAddress';
import { YlideCheckbox } from '../../../controls/YlideCheckbox';
import contacts from '../../../stores/Contacts';
import { FolderId, getFolderName } from '../../../stores/MailList';
import { useNav } from '../../../utils/navigate';

interface MailboxHeaderProps {
	folderId: FolderId;
	filterBySender?: string;
	isAllSelected: boolean;
	onSelectAllCheckBoxClick: (isChecked: boolean) => void;
	onMarkReadClick: () => void;
	onDeleteClick: () => void;
	onRestoreClick: () => void;
}

export const MailboxHeader = observer(
	({
		folderId,
		filterBySender,
		isAllSelected,
		onSelectAllCheckBoxClick,
		onMarkReadClick,
		onDeleteClick,
		onRestoreClick,
	}: MailboxHeaderProps) => {
		const navigate = useNav();
		const contact = filterBySender ? contacts.contactsByAddress[filterBySender] : null;

		return (
			<div className="mailbox-header">
				<div className="mailbox-title">
					{folderId ? (
						<>
							{getFolderName(folderId)}

							<div className="mailbox-title-secondary">
								{!!filterBySender && (
									<>
										{'from '}
										{contact ? contact.name : <AdaptiveAddress address={filterBySender} />}
									</>
								)}
							</div>
						</>
					) : (
						'Loading...'
					)}
				</div>

				<div className="mailbox-tools">
					<Tooltip title={isAllSelected ? 'Deselect all' : 'Select all'}>
						<div className="global-checkbox-wrapper">
							<YlideCheckbox checked={isAllSelected} onCheck={onSelectAllCheckBoxClick} />
						</div>
					</Tooltip>

					<Tooltip title="Mark as read">
						<ActionButton
							onClick={() => onMarkReadClick()}
							icon={<i className={`fa ${smallButtonIcons.eye}`} />}
						/>
					</Tooltip>

					{folderId === FolderId.Archive && (
						<Tooltip title="Restore mails">
							<ActionButton
								onClick={() => onRestoreClick()}
								icon={<i className={`fa ${smallButtonIcons.restore}`} />}
							/>
						</Tooltip>
					)}

					{folderId !== FolderId.Sent && (
						<Tooltip title="Archive mails">
							<ActionButton
								onClick={() => onDeleteClick()}
								icon={<i className={`fa ${smallButtonIcons.trash}`} />}
							/>
						</Tooltip>
					)}

					{!!filterBySender && (
						<ActionButton
							style={ActionButtonStyle.Primary}
							icon={<i className={`fa ${smallButtonIcons.cross}`} />}
							onClick={() => navigate({ search: {} })}
						>
							Clear filter
						</ActionButton>
					)}
				</div>
			</div>
		);
	},
);
