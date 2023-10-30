import { ActionButton, ActionButtonLook } from '../../../../components/actionButton/actionButton';
import { CheckBox } from '../../../../components/checkBox/checkBox';
import { ContactName } from '../../../../components/contactName/contactName';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { ReactComponent as MerkReadSvg } from '../../../../icons/ic20/markRead.svg';
import { ReactComponent as RefreshSvg } from '../../../../icons/ic20/refresh.svg';
import { ReactComponent as RestoreSvg } from '../../../../icons/ic20/restore.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { FolderId, getFolderName, ILinkedMessage } from '../../../../stores/MailList';
import { useNav } from '../../../../utils/url';

interface MailboxHeaderProps {
	folderId: FolderId;
	messages: ILinkedMessage[];
	selectedMessageIds: Set<string>;
	filterBySender?: string;
	isAllSelected: boolean;
	onSelectAllCheckBoxClick: (isChecked: boolean) => void;
	refreshButton: {
		disabled: boolean;
		onClick: () => void;
	};
	onMarkReadClick: () => void;
	onDeleteClick: () => void;
	onRestoreClick: () => void;
}

export function MailboxHeader({
	folderId,
	messages,
	selectedMessageIds,
	filterBySender,
	isAllSelected,
	onSelectAllCheckBoxClick,
	refreshButton,
	onMarkReadClick,
	onDeleteClick,
	onRestoreClick,
}: MailboxHeaderProps) {
	const navigate = useNav();

	const isActionButtonsDisabled = !selectedMessageIds.size;

	return (
		<div className="mailbox-header">
			<div className="mailbox-title">
				{getFolderName(folderId)}

				{!!filterBySender && (
					<div className="mailbox-title-secondary">
						{'from '}
						<ContactName address={filterBySender} />
					</div>
				)}
			</div>

			<div className="mailbox-tools">
				<div className="global-checkbox-wrapper" title="Select all">
					<CheckBox
						isDisabled={!messages.length}
						isChecked={isAllSelected}
						onChange={onSelectAllCheckBoxClick}
					/>
				</div>

				<ActionButton
					isDisabled={refreshButton.disabled}
					icon={<RefreshSvg />}
					title="Refresh"
					onClick={() => refreshButton.onClick()}
				/>

				<ActionButton
					isDisabled={isActionButtonsDisabled}
					icon={<MerkReadSvg />}
					title="Mark as read"
					onClick={() => onMarkReadClick()}
				/>

				{folderId === FolderId.Archive && (
					<ActionButton
						isDisabled={isActionButtonsDisabled}
						icon={<RestoreSvg />}
						title="Restore"
						onClick={() => onRestoreClick()}
					/>
				)}

				{folderId === FolderId.Inbox && (
					<ActionButton
						isDisabled={isActionButtonsDisabled}
						icon={<TrashSvg />}
						title="Archive"
						onClick={() => onDeleteClick()}
					/>
				)}

				{!!filterBySender && (
					<ActionButton
						look={ActionButtonLook.PRIMARY}
						icon={<CrossSvg />}
						onClick={() => navigate({ search: {} })}
					>
						Clear filter
					</ActionButton>
				)}
			</div>
		</div>
	);
}
