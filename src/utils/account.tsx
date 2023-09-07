import { EVMNetwork } from '@ylide/ethereum';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../components/ActionButton/ActionButton';
import { ActionModal } from '../components/actionModal/actionModal';
import { showLoadingModal } from '../components/loadingModal/loadingModal';
import { NewPasswordModal } from '../components/newPasswordModal/newPasswordModal';
import { SelectWalletModal } from '../components/selectWalletModal/selectWalletModal';
import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import { SwitchModal, SwitchModalMode } from '../components/switchModal/switchModal';
import { toast } from '../components/toast/toast';
import { AppMode, REACT_APP__APP_MODE } from '../env';
import { analytics } from '../stores/Analytics';
import domain from '../stores/Domain';
import { DomainAccount } from '../stores/models/DomainAccount';
import { Wallet } from '../stores/models/Wallet';
import { getQueryString } from './getQueryString';
import { truncateInMiddle } from './string';
import { walletsMeta } from './wallet';

export function formatAccountName(account: DomainAccount) {
	const walletName = walletsMeta[account.wallet.wallet].title;

	return account.name
		? `${account.name} (${truncateInMiddle(account.account.address, 8, '..')}, ${walletName})`
		: `${truncateInMiddle(account.account.address, 12, '..')} (${walletName})`;
}

//

export async function connectAccount(params?: { place?: string }): Promise<DomainAccount | undefined> {
	if (params?.place) {
		analytics.startConnectingWallet(params.place);
	}

	const closeLoadingModal = showLoadingModal({ reason: 'Connecting account ...' });

	try {
		let wallet: Wallet | undefined;
		const proxyAccount = domain.availableProxyAccounts[0];

		if (proxyAccount) {
			const useProxy = await showStaticComponent<boolean>(resolve => (
				<ActionModal
					title="Connect same account?"
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
				>
					<div>
						We noticed that you're using Ylide within another application. You can connect the same account
						as the parent application uses –{' '}
						<b>{truncateInMiddle(proxyAccount.account.address, 8, '...')}</b>
					</div>

					<div>We recommend connecting the same account to get seamless user experience.</div>
				</ActionModal>
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
					currentAccount = await wallet.getCurrentAccount();
				}

				if (currentAccount && wallet.isAccountRegistered(currentAccount)) {
					if (wallet.factory.blockchainGroup === 'evm') {
						const result = await SwitchModal.show(wallet, {
							mode: SwitchModalMode.CURRENT_ACCOUNT_ALREADY_CONNECTED,
							account: currentAccount,
						});
						if (!result) return;
					} else {
						await requestWalletAuthentication(wallet);
					}

					currentAccount = await wallet.getCurrentAccount();
				}

				if (currentAccount && wallet.isAccountRegistered(currentAccount)) {
					const domainAccount = wallet.accounts.find(a => a.account.address === currentAccount!.address)!;
					if (domainAccount.isAnyLocalPrivateKeyRegistered) {
						return toast('This account is already connected. Please choose another one.');
					} else {
						await domain.accounts.removeAccount(domainAccount);
					}
				}

				return await wallet.connectAccount();
			}

			const account = await connectWalletAccount(wallet);
			if (!account) return;

			const remoteKeys = await domain.ylide.core.getAddressKeys(account.address);
			const qqs = getQueryString();

			const domainAccount = await showStaticComponent<DomainAccount>(resolve => (
				<NewPasswordModal
					faucetType={['polygon', 'fantom', 'gnosis'].includes(qqs.faucet) ? ({
						'polygon': EVMNetwork.POLYGON as const,
						'fantom': EVMNetwork.FANTOM as const,
						'gnosis': EVMNetwork.GNOSIS as const,
					}[qqs.faucet as ('polygon' | 'fantom' | 'gnosis')]) : EVMNetwork.GNOSIS}
					bonus={qqs.bonus === 'true'}
					wallet={wallet!}
					account={account}
					remoteKeys={remoteKeys.remoteKeys}
					waitTxPublishing={REACT_APP__APP_MODE === AppMode.OTC}
					onClose={resolve}
				/>
			));

			return domainAccount;
		}
	} catch (e) {
		console.error(e);
	} finally {
		closeLoadingModal();
	}
}

export async function activateAccount(params: { account: DomainAccount }) {
	const account = params.account;
	const wallet = account.wallet;
	const remoteKeys = await domain.ylide.core.getAddressKeys(account.account.address);
	const qqs = getQueryString();

	await showStaticComponent<DomainAccount>(resolve => (
		<NewPasswordModal
			faucetType={['polygon', 'fantom', 'gnosis'].includes(qqs.faucet) ? ({
				'polygon': EVMNetwork.POLYGON as const,
				'fantom': EVMNetwork.FANTOM as const,
				'gnosis': EVMNetwork.GNOSIS as const,
			}[qqs.faucet as ('polygon' | 'fantom' | 'gnosis')]) : EVMNetwork.GNOSIS}
			bonus={qqs.bonus === 'true'}
			wallet={wallet}
			account={account.account}
			remoteKeys={remoteKeys.remoteKeys}
			onClose={resolve}
		/>
	));
}

export async function disconnectAccount(params: { account: DomainAccount; place?: string }) {
	const { account, place } = params;

	if (place) {
		analytics.disconnectWallet(place, account.wallet.wallet, account.account.address);
	}

	await account.wallet.disconnectAccount(account);
	await domain.accounts.removeAccount(account);
	account.mainViewKey = '';

	if (account.wallet.factory.wallet === 'walletconnect') {
		domain.disconnectWalletConnect();
	}
}

export async function requestWalletAuthentication(wallet: Wallet) {
	try {
		if (!wallet.controller.isMultipleAccountsSupported()) {
			const account = await wallet.getCurrentAccount();
			if (account) {
				await wallet.controller.disconnectAccount(account);
			}
		}

		await wallet.controller.requestAuthentication();
	} catch (e) {
		console.log('Error in requestSwitchAccount', e);
	}
}
