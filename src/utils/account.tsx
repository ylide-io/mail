import React from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../components/ActionButton/ActionButton';
import { ActionModal } from '../components/actionModal/actionModal';
import { NewPasswordModal } from '../components/newPasswordModal/newPasswordModal';
import { SelectWalletModal } from '../components/selectWalletModal/selectWalletModal';
import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import { SwitchModal } from '../components/switchModal/switchModal';
import { toast } from '../components/toast/toast';
import domain from '../stores/Domain';
import { DomainAccount } from '../stores/models/DomainAccount';
import { Wallet } from '../stores/models/Wallet';
import { invariant } from './assert';
import { getQueryString } from './getQueryString';
import { truncateInMiddle } from './string';
import { walletsMeta } from './wallet';

export async function connectAccount(): Promise<DomainAccount | undefined> {
	let wallet: Wallet | undefined;
	const proxyAccount = domain.availableProxyAccounts[0];

	if (proxyAccount) {
		const useProxy = await showStaticComponent<boolean>(resolve => (
			<ActionModal
				title="Connect same account?"
				description={
					<>
						We noticed that you're using Ylide within another application. You can connect the same account
						as the parent application uses –{' '}
						<b>{truncateInMiddle(proxyAccount.account.address, 8, '...')}</b>
						<br />
						<br />
						We recommend connecting the same account to get seamless user experience.
					</>
				}
				buttons={[
					<ActionButton
						size={ActionButtonSize.XLARGE}
						look={ActionButtonLook.PRIMARY}
						onClick={() => resolve(true)}
					>
						Connect same account
					</ActionButton>,
					<ActionButton
						size={ActionButtonSize.XLARGE}
						look={ActionButtonLook.LITE}
						onClick={() => resolve(false)}
					>
						Use another one
					</ActionButton>,
				]}
				onClose={resolve}
			/>
		));

		if (useProxy == null) {
			return;
		} else if (useProxy) {
			wallet = proxyAccount.wallet;
		}
	}

	if (!wallet) {
		wallet = await showStaticComponent<Wallet>(resolve => <SelectWalletModal onClose={resolve} />);
	}

	if (wallet) {
		async function connectWalletAccount(wallet: Wallet) {
			const walletMeta = walletsMeta[wallet.wallet];
			let currentAccount = await wallet.getCurrentAccount();
			// to fix everwallet stuck in auth state without registered key
			if (
				currentAccount &&
				!wallet.isAccountRegistered(currentAccount) &&
				!wallet.controller.isMultipleAccountsSupported() &&
				!walletMeta.isProxy
			) {
				await wallet.controller.disconnectAccount(currentAccount);
			}
			currentAccount = await wallet.getCurrentAccount();
			if (currentAccount && wallet.isAccountRegistered(currentAccount)) {
				const result = await SwitchModal.show('account', wallet);
				if (!result) return;
			}
			currentAccount = await wallet.getCurrentAccount();
			if (currentAccount && wallet.isAccountRegistered(currentAccount)) {
				const domainAccount = wallet.accounts.find(a => a.account.address === currentAccount!.address)!;
				if (domainAccount.isLocalKeyRegistered) {
					toast('This account is already connected. Please choose a different one.');
					return;
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

export async function disconnectAccount(account: DomainAccount) {
	await account.wallet.disconnectAccount(account);
	await domain.accounts.removeAccount(account);
	account.mainViewKey = '';

	if (account.wallet.factory.wallet === 'walletconnect') {
		domain.disconnectWalletConnect();
	}
}
