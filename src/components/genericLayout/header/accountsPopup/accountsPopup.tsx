import { Tooltip } from 'antd';
import { observer } from 'mobx-react';
import React, { RefObject } from 'react';

import { ReactComponent as EditSvg } from '../../../../icons/ic20/edit.svg';
import { ReactComponent as PlusSvg } from '../../../../icons/ic20/plus.svg';
import { ReactComponent as LogoutSvg } from '../../../../icons/ic28/logout.svg';
import { useSelectWalletModal } from '../../../../modals/SelectWalletModal';
import domain from '../../../../stores/Domain';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { walletsMeta } from '../../../../utils/wallet';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../adaptiveAddress/adaptiveAddress';
import { Blockie } from '../../../blockie/blockie';
import { AnchoredPopup } from '../../../popup/anchoredPopup/anchoredPopup';
import css from './accountsPopup.module.scss';

interface AccountsPopupProps {
	anchorRef: RefObject<HTMLElement>;
	onClose: () => void;
}

export const AccountsPopup = observer(({ anchorRef, onClose }: AccountsPopupProps) => {
	const selectWalletModal = useSelectWalletModal();

	return (
		<AnchoredPopup
			anchorRef={anchorRef}
			className={css.root}
			horizontalAlign={HorizontalAlignment.END}
			alignerOptions={{ fitLeftToViewport: true }}
			onCloseRequest={onClose}
		>
			<div className={css.content}>
				{domain.accounts.accounts.map(account => (
					<div key={account.account.address} className={css.item}>
						<Blockie className={css.itemIcon} address={account.account.address} />
						<div className={css.itemBody}>
							<div className={css.itemName}>
								<div className={css.itemNameInner}>{account.name}</div>
								<Tooltip title="Rename">
									<ActionButton
										look={ActionButtonLook.LITE}
										icon={<EditSvg />}
										onClick={async () => {
											const newName = prompt('Enter new account name: ', account.name);
											if (newName) {
												await account.rename(newName);
											}
										}}
									/>
								</Tooltip>
							</div>
							<div className={css.itemWallet}>
								{walletsMeta[account.wallet.wallet].logo(12)} {walletsMeta[account.wallet.wallet].title}
							</div>
							<AdaptiveAddress className={css.itemAddress} address={account.account.address} />
						</div>
						<div className={css.itemActions}>
							<Tooltip title="Logout">
								<ActionButton
									size={ActionButtonSize.MEDIUM}
									look={ActionButtonLook.DANGEROUS}
									icon={<LogoutSvg />}
									onClick={async () => {
										await account.wallet.disconnectAccount(account);
										await domain.accounts.removeAccount(account);

										if (!domain.accounts.hasActiveAccounts) {
											onClose();
										}
									}}
								/>
							</Tooltip>
						</div>
					</div>
				))}

				<div className={css.addAccountRow}>
					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						icon={<PlusSvg />}
						onClick={async () => {
							onClose();
							await selectWalletModal({});
						}}
					>
						Connect account
					</ActionButton>
				</div>
			</div>
		</AnchoredPopup>
	);
});
