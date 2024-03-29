import React from 'react';

import { walletsMeta } from '../../constants';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { truncateInMiddle } from '../../utils/string';
import { DropDownItem } from '../dropDown/dropDown';
import { PropsWithClassName } from '../propsWithClassName';
import { Select } from '../select/select';

export function formatDomainAccount(account: DomainAccount) {
	return `${account.name} (${truncateInMiddle(account.account.address, 10, '..')}) [${
		walletsMeta[account.wallet.wallet].title
	}]`;
}

interface AccountSelectProps extends PropsWithClassName {
	activeAccount?: DomainAccount;
	onChange?: (account: DomainAccount) => void;
}

export function AccountSelect({ className, activeAccount, onChange }: AccountSelectProps) {
	return (
		<Select
			className={className}
			text={activeAccount && formatDomainAccount(activeAccount)}
			placeholder="Select account"
		>
			{onSelect =>
				domain.accounts.activeAccounts.map((account, i) => (
					<DropDownItem
						key={i}
						onSelect={() => {
							onSelect();
							onChange?.(account);
						}}
					>
						{formatDomainAccount(account)}
					</DropDownItem>
				))
			}
		</Select>
	);
}
