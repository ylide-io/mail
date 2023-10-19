import { WalletAccount } from '@ylide/sdk';
import { useEffect, useState } from 'react';

import { Wallet } from '../../stores/models/Wallet';
import { requestWalletAuthentication } from '../../utils/account';
import { ActionModal } from '../actionModal/actionModal';
import { ErrorMessage } from '../errorMessage/errorMessage';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import { WalletTag } from '../walletTag/walletTag';

export enum SwitchModalMode {
	CURRENT_ACCOUNT_ALREADY_CONNECTED = 'CURRENT_ACCOUNT_ALREADY_CONNECTED',
	SPECIFIC_ACCOUNT_REQUIRED = 'SPECIFIC_ACCOUNT_REQUIRED',
}

type SwitchModalPayload =
	| { mode: SwitchModalMode.CURRENT_ACCOUNT_ALREADY_CONNECTED; account: WalletAccount }
	| {
			mode: SwitchModalMode.SPECIFIC_ACCOUNT_REQUIRED;
			needAccount: WalletAccount;
	  };

interface SwitchModalProps {
	wallet: Wallet;
	payload: SwitchModalPayload;
	currentAccount?: WalletAccount;
	onConfirm: (result: boolean) => void;
}

export function SwitchModal({ wallet, payload, currentAccount, onConfirm }: SwitchModalProps) {
	const [error, setError] = useState('');

	useEffect(() => {
		function handleAccountUpdate(account: WalletAccount | null) {
			if (!account) return;

			if (
				payload.mode !== SwitchModalMode.SPECIFIC_ACCOUNT_REQUIRED ||
				account.address === payload.needAccount.address
			) {
				onConfirm(true);
			} else {
				setError('Wrong account selected in wallet 😟');
			}
		}

		wallet.on('accountUpdate', handleAccountUpdate);

		requestWalletAuthentication(wallet);

		return () => {
			wallet.off('accountUpdate', handleAccountUpdate);
		};
	}, [onConfirm, payload, wallet]);

	return (
		<>
			{wallet.wallet !== 'everwallet' && (
				<ActionModal
					title={currentAccount ? 'Switch account' : 'Activate account'}
					onClose={() => onConfirm(false)}
				>
					{payload.mode === SwitchModalMode.CURRENT_ACCOUNT_ALREADY_CONNECTED && (
						<>
							<WalletTag wallet={wallet.wallet} address={payload.account.address} />

							<div>
								Please open your wallet and switch to another account. Your currently active account is
								connected already. You cannot connect the same account twice 😉
							</div>
						</>
					)}

					{payload.mode === SwitchModalMode.SPECIFIC_ACCOUNT_REQUIRED && (
						<>
							<WalletTag wallet={wallet.wallet} address={payload.needAccount.address} />

							<div>
								Please open your wallet and make sure the correct account is selected and connected to
								the app.
							</div>
						</>
					)}

					{!!error && <ErrorMessage>{error}</ErrorMessage>}
				</ActionModal>
			)}
		</>
	);
}

export namespace SwitchModal {
	export function show(wallet: Wallet, payload: SwitchModalPayload, currentAccount?: WalletAccount) {
		return showStaticComponent<boolean>(resolve => (
			<SwitchModal wallet={wallet} payload={payload} currentAccount={currentAccount} onConfirm={resolve} />
		));
	}
}
