import { observer } from 'mobx-react';
import React from 'react';

import { ReactComponent as PlusSvg } from '../../icons/ic20/plus.svg';
import { SelectWalletModal } from '../../modals/SelectWalletModal';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { truncateInMiddle } from '../../utils/string';
import { walletsMeta } from '../../utils/wallet';
import { ActionButton, ActionButtonLook } from '../ActionButton/ActionButton';
import { DropDownItem, DropDownItemMode } from '../dropDown/dropDown';
import { PropsWithClassName } from '../propsWithClassName';
import { Select } from '../select/select';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';

export function formatDomainAccount(account: DomainAccount) {
	return `${account.name} (${truncateInMiddle(account.account.address, 10, '..')}) [${
		walletsMeta[account.wallet.wallet].title
	}]`;
}

interface AccountSelectProps extends PropsWithClassName {
	activeAccount?: DomainAccount;
	onChange?: (account: DomainAccount) => void;
}

export const AccountSelect = observer(({ className, activeAccount, onChange }: AccountSelectProps) => {
	return (
		<Select
			className={className}
			text={activeAccount && formatDomainAccount(activeAccount)}
			placeholder="Select account"
		>
			{onSelect => (
				<>
					{domain.accounts.activeAccounts.map((account, i) => (
						<DropDownItem
							key={i}
							mode={account === activeAccount ? DropDownItemMode.HIGHLIGHTED : undefined}
							onSelect={() => {
								onSelect();
								onChange?.(account);
							}}
						>
							{formatDomainAccount(account)}
						</DropDownItem>
					))}

					<DropDownItem mode={DropDownItemMode.WRAPPER}>
						<ActionButton
							look={ActionButtonLook.LITE}
							icon={<PlusSvg />}
							style={{ margin: 'auto' }}
							onClick={async () => {
								onSelect();

								const newAccount = await showStaticComponent<DomainAccount>(resolve => (
									<SelectWalletModal onClose={resolve} />
								));

								if (newAccount) {
									onChange?.(newAccount);
								}
							}}
						>
							Connect Account
						</ActionButton>
					</DropDownItem>
				</>
			)}
		</Select>
	);
});
