import clsx from 'clsx';
import { observer } from 'mobx-react';
import { RefObject } from 'react';

import { ReactComponent as EditSvg } from '../../../../icons/ic20/edit.svg';
import { ReactComponent as PlusSvg } from '../../../../icons/ic20/plus.svg';
import { ReactComponent as LogoutSvg } from '../../../../icons/ic28/logout.svg';
import { analytics } from '../../../../stores/Analytics';
import domain from '../../../../stores/Domain';
import { connectAccount, disconnectAccount } from '../../../../utils/account';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { walletsMeta } from '../../../../utils/wallet';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../adaptiveAddress/adaptiveAddress';
import { AdaptiveText } from '../../../adaptiveText/adaptiveText';
import { Avatar } from '../../../avatar/avatar';
import { AnchoredPopup } from '../../../popup/anchoredPopup/anchoredPopup';
import css from './accountsPopup.module.scss';

interface AccountsPopupProps {
	anchorRef: RefObject<HTMLElement>;
	onClose: () => void;
}

export const AccountsPopup = observer(({ anchorRef, onClose }: AccountsPopupProps) => {
	const accounts = domain.accounts.accounts;

	return (
		<AnchoredPopup
			anchorRef={anchorRef}
			className={css.root}
			horizontalAlign={HorizontalAlignment.END}
			alignerOptions={{ fitLeftToViewport: true }}
			onCloseRequest={onClose}
		>
			<div className={css.content}>
				{accounts.map(account => (
					<div key={account.account.address} className={css.item}>
						<Avatar className={css.itemIcon} blockie={account.account.address} />
						<div className={css.itemBody}>
							<div className={css.itemName}>
								<AdaptiveText
									className={clsx(css.itemNameInner, !account.name && css.itemNameInner_empty)}
									text={account.name || 'No name'}
								/>

								<ActionButton
									look={ActionButtonLook.LITE}
									icon={<EditSvg />}
									title="Rename"
									onClick={async () => {
										analytics.renameAccount(
											'accounts-popup',
											account.wallet.wallet,
											account.account.address,
										);

										const newName = prompt('Enter new account name: ', account.name) || '';
										await account.rename(newName);
									}}
								/>
							</div>
							<div className={css.itemWallet}>
								{walletsMeta[account.wallet.wallet].logo(12)} {walletsMeta[account.wallet.wallet].title}
							</div>
							<AdaptiveAddress className={css.itemAddress} address={account.account.address} />
						</div>
						<div className={css.itemActions}>
							<ActionButton
								size={ActionButtonSize.MEDIUM}
								look={ActionButtonLook.DANGEROUS}
								icon={<LogoutSvg />}
								title="Logout"
								onClick={async () => {
									await disconnectAccount({ account, place: 'accounts-popup' });

									if (!accounts.length) {
										onClose();
									}
								}}
							/>
						</div>
					</div>
				))}

				<div className={css.addAccountRow}>
					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						icon={<PlusSvg />}
						onClick={() => {
							onClose();
							connectAccount({ place: 'accounts-popup' });
						}}
					>
						Connect account
					</ActionButton>
				</div>
			</div>
		</AnchoredPopup>
	);
});
