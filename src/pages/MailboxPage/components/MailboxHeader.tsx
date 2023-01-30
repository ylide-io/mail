import { Tooltip } from 'antd';

import { ActionButton, ActionButtonStyle } from '../../../components/ActionButton/ActionButton';
import { CheckBox } from '../../../components/checkBox/checkBox';
import { ContactName } from '../../../components/contactName/contactName';
import { smallButtonIcons } from '../../../components/smallButton/smallButton';
import { FolderId, getFolderName } from '../../../stores/MailList';
import { useNav } from '../../../utils/navigate';

interface MailboxHeaderProps {
	folderId: FolderId;
	filterBySender?: string;
	isAllSelected: boolean;
	onSelectAllCheckBoxClick: (isChecked: boolean) => void;
	isActionButtonsDisabled: boolean;
	onMarkReadClick: () => void;
	onDeleteClick: () => void;
	onRestoreClick: () => void;
}

export function MailboxHeader({
	folderId,
	filterBySender,
	isAllSelected,
	onSelectAllCheckBoxClick,
	isActionButtonsDisabled,
	onMarkReadClick,
	onDeleteClick,
	onRestoreClick,
}: MailboxHeaderProps) {
	const navigate = useNav();

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
									<ContactName address={filterBySender} />
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
						<CheckBox isChecked={isAllSelected} onChange={onSelectAllCheckBoxClick} />
					</div>
				</Tooltip>

				<Tooltip title="Mark as read">
					<ActionButton
						icon={<i className={`fa ${smallButtonIcons.eye}`} />}
						isDisabled={isActionButtonsDisabled}
						onClick={() => onMarkReadClick()}
					/>
				</Tooltip>

				{folderId === FolderId.Archive && (
					<Tooltip title="Restore mails">
						<ActionButton
							icon={<i className={`fa ${smallButtonIcons.restore}`} />}
							isDisabled={isActionButtonsDisabled}
							onClick={() => onRestoreClick()}
						/>
					</Tooltip>
				)}

				{folderId === FolderId.Inbox && (
					<Tooltip title="Archive mails">
						<ActionButton
							icon={<i className={`fa ${smallButtonIcons.trash}`} />}
							isDisabled={isActionButtonsDisabled}
							onClick={() => onDeleteClick()}
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
}
