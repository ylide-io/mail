import { observer } from 'mobx-react';
import React from 'react';

import { ReactComponent as PlusSvg } from '../../icons/ic20/plus.svg';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { connectAccount } from '../../utils/account';
import { truncateInMiddle } from '../../utils/string';
import { walletsMeta } from '../../utils/wallet';
import { ActionButton, ActionButtonLook } from '../ActionButton/ActionButton';
import { DropDownItem, DropDownItemMode } from '../dropDown/dropDown';
import { PropsWithClassName } from '../props';
import { Select } from '../select/select';

export function formatFullAccountName(account: DomainAccount) {
	const walletName = walletsMeta[account.wallet.wallet].title;

	return account.name
		? `${account.name} (${truncateInMiddle(account.account.address, 8, '..')}, ${walletName})`
		: `${truncateInMiddle(account.account.address, 16, '..')} (${walletName})`;
}

interface AccountSelectProps extends PropsWithClassName {
	activeAccount?: DomainAccount;
	onChange?: (account: DomainAccount) => void;
}

export const AccountSelect = observer(({ className, activeAccount, onChange }: AccountSelectProps) => {
	return (
		<Select
			className={className}
			text={activeAccount && formatFullAccountName(activeAccount)}
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
							{formatFullAccountName(account)}
						</DropDownItem>
					))}

					<DropDownItem mode={DropDownItemMode.WRAPPER}>
						<ActionButton
							look={ActionButtonLook.LITE}
							icon={<PlusSvg />}
							style={{ margin: 'auto' }}
							onClick={async () => {
								onSelect();

								const newAccount = await connectAccount();

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
