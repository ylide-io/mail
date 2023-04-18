import React from 'react';

import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import { NewPasswordModal } from '../modals/NewPasswordModal';
import { SelectWalletModal } from '../modals/SelectWalletModal';
import SwitchModal from '../modals/SwitchModal';
import domain from '../stores/Domain';
import { DomainAccount } from '../stores/models/DomainAccount';
import { Wallet } from '../stores/models/Wallet';
import { invariant } from './assert';
import { getQueryString } from './getQueryString';

export async function connectAccount(options?: { walletName?: string }): Promise<DomainAccount | undefined> {
	let wallet = options?.walletName ? domain.wallets.find(w => w.wallet === options.walletName)! : undefined;

	if (!wallet) {
		wallet = await showStaticComponent<Wallet>(resolve => <SelectWalletModal onClose={resolve} />);
	}

	if (wallet) {
		async function connectWalletAccount(wallet: Wallet) {
			let currentAccount = await wallet.getCurrentAccount();
			// to fix everwallet stuck in auth state without registered key
			if (
				currentAccount &&
				!wallet.isAccountRegistered(currentAccount) &&
				!wallet.controller.isMultipleAccountsSupported()
			) {
				await wallet.controller.disconnectAccount(currentAccount);
			}
			currentAccount = await wallet.getCurrentAccount();
			if (currentAccount && wallet.isAccountRegistered(currentAccount)) {
				const result = await SwitchModal.show('account', wallet);
				if (!result) {
					return null;
				}
			}
			currentAccount = await wallet.getCurrentAccount();
			if (currentAccount && wallet.isAccountRegistered(currentAccount)) {
				const domainAccount = wallet.accounts.find(a => a.account.address === currentAccount!.address)!;
				if (domainAccount.isLocalKeyRegistered) {
					alert('This account is already connected. Please choose a different one.');
					return null;
				} else {
					await domain.accounts.removeAccount(domainAccount);
					return await wallet.connectAccount();
				}
			} else {
				return await wallet.connectAccount();
			}
		}

		const account = await connectWalletAccount(wallet);
		invariant(account);

		const remoteKeys = await wallet.readRemoteKeys(account);
		const qqs = getQueryString();

		return await showStaticComponent<DomainAccount>(resolve => (
			<NewPasswordModal
				faucetType={['polygon', 'fantom', 'gnosis'].includes(qqs.faucet) ? (qqs.faucet as any) : 'gnosis'}
				bonus={qqs.bonus === 'true'}
				wallet={wallet!}
				account={account}
				remoteKeys={remoteKeys.remoteKeys}
				onClose={resolve}
			/>
		));
	}
}
