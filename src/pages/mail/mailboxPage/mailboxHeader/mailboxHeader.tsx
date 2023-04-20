import React from 'react';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { CheckBox } from '../../../../components/checkBox/checkBox';
import { ContactName } from '../../../../components/contactName/contactName';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { ReactComponent as MerkReadSvg } from '../../../../icons/ic20/markRead.svg';
import { ReactComponent as RestoreSvg } from '../../../../icons/ic20/restore.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { FolderId, getFolderName } from '../../../../stores/MailList';
import { useNav } from '../../../../utils/url';

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
				<div className="global-checkbox-wrapper" title="Select all">
					<CheckBox isChecked={isAllSelected} onChange={onSelectAllCheckBoxClick} />
				</div>

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
