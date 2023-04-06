import { observer } from 'mobx-react';
import React from 'react';
import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { useToastManager } from '../../../../components/toast/toast';
import { ReactComponent as ClipboardSvg } from '../../../../icons/ic20/clipboard.svg';
import { ReactComponent as PlusSvg } from '../../../../icons/ic20/plus.svg';
import { useSelectWalletModal } from '../../../../modals/SelectWalletModal';
import domain from '../../../../stores/Domain';
import { FolderId } from '../../../../stores/MailList';
import { RoutePath } from '../../../../stores/routePath';
import { assertUnreachable } from '../../../../utils/assert';
import { copyToClipboard } from '../../../../utils/clipboard';
import { useNav } from '../../../../utils/url';
import css from './mailboxEmpty.module.scss';

interface MailboxEmptyProps {
	folderId: FolderId;
}

const MailboxEmpty = observer(({ folderId }: MailboxEmptyProps) => {
	const navigate = useNav();
	const selectWalletModal = useSelectWalletModal();
	const { toast } = useToastManager();

	return (
		<div className={css.root}>
			{!domain.accounts.hasActiveAccounts ? (
				<>
					<div className={css.title}>Connect your account to start using Ylide Mail</div>

					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						icon={<PlusSvg />}
						onClick={async () => await selectWalletModal({})}
					>
						Connect account
					</ActionButton>
				</>
			) : folderId === FolderId.Inbox ? (
				<>
					<div className={css.title}>Mailbox is empty</div>

					<span>Share your address with your friends to receive the first message</span>

					<div className={css.addresses}>
						{domain.accounts.activeAccounts.map(a => (
							<>
								<ActionButton
									look={ActionButtonLook.PRIMARY}
									icon={<ClipboardSvg />}
									title="Copy to clipboard"
									onClick={async () => {
										await copyToClipboard(a.account.address);
										toast('Copied to clipboard 🔥');
									}}
								/>

								<AdaptiveAddress address={a.account.address} />
							</>
						))}
					</div>
				</>
			) : folderId === FolderId.Sent ? (
				<>
					<div className={css.title}>You haven't sent any messages yet</div>

					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						onClick={() => navigate(generatePath(RoutePath.MAIL_COMPOSE))}
					>
						Compose Mail
					</ActionButton>
				</>
			) : folderId === FolderId.Archive ? (
				<div className={css.title}>No archived messages</div>
			) : (
				assertUnreachable(folderId)
			)}
		</div>
	);
});

export default MailboxEmpty;
