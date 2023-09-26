import { observer } from 'mobx-react';
import { RefObject } from 'react';

import { DomainAccount } from '../../stores/models/DomainAccount';
import { formatAccountName } from '../../utils/account';
import { HorizontalAlignment } from '../../utils/alignment';
import { Avatar } from '../avatar/avatar';
import { AnchoredPopup } from '../popup/anchoredPopup/anchoredPopup';
import css from './selectAccountPopup.module.scss';

export interface SelectAccountPopupProps {
	anchorRef: RefObject<HTMLElement>;
	accounts: DomainAccount[];
	onSelect: (account: DomainAccount) => void;
	onClose?: () => void;
}

export const SelectAccountPopup = observer(({ anchorRef, accounts, onSelect, onClose }: SelectAccountPopupProps) => {
	return (
		<AnchoredPopup
			className={css.root}
			anchorRef={anchorRef}
			horizontalAlign={HorizontalAlignment.START}
			onCloseRequest={onClose}
		>
			<div className={css.inner}>
				<div className={css.title}>Choose account you want to use:</div>

				<div className={css.list}>
					{accounts.map(account => (
						<div key={account.account.address} className={css.account} onClick={() => onSelect(account)}>
							<Avatar blockie={account.account.address} />

							<div className={css.accountText}>{formatAccountName(account)}</div>
						</div>
					))}
				</div>
			</div>
		</AnchoredPopup>
	);
});
