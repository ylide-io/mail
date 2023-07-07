import { observer } from 'mobx-react';
import React from 'react';

import { ReactComponent as PlusSvg } from '../../icons/ic20/plus.svg';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { connectAccount, formatAccountName } from '../../utils/account';
import { ActionButton, ActionButtonLook } from '../ActionButton/ActionButton';
import { DropDownItem, DropDownItemMode } from '../dropDown/dropDown';
import { PropsWithClassName } from '../props';
import { Select } from '../select/select';

interface AccountSelectProps extends PropsWithClassName {
	accounts?: DomainAccount[];
	activeAccount?: DomainAccount;
	onChange?: (account: DomainAccount) => void;
}

export const AccountSelect = observer(({ className, activeAccount, onChange, ...props }: AccountSelectProps) => {
	const accounts = props.accounts || domain.accounts.activeAccounts;

	return (
		<Select
			className={className}
			text={activeAccount && formatAccountName(activeAccount)}
			placeholder="Select account"
		>
			{onSelect => (
				<>
					{accounts.map((account, i) => (
						<DropDownItem
							key={i}
							mode={account === activeAccount ? DropDownItemMode.HIGHLIGHTED : undefined}
							onSelect={() => {
								onSelect();
								onChange?.(account);
							}}
						>
							{formatAccountName(account)}
						</DropDownItem>
					))}

					<DropDownItem mode={DropDownItemMode.WRAPPER}>
						<ActionButton
							look={ActionButtonLook.LITE}
							icon={<PlusSvg />}
							style={{ margin: 'auto' }}
							onClick={async () => {
								onSelect();

								const newAccount = await connectAccount({ place: 'account-select' });

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
