import { IGenericAccount } from '@ylide/sdk';
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
	| { mode: SwitchModalMode.CURRENT_ACCOUNT_ALREADY_CONNECTED }
	| {
			mode: SwitchModalMode.SPECIFIC_ACCOUNT_REQUIRED;
			needAccount: IGenericAccount;
	  };

interface SwitchModalProps {
	wallet: Wallet;
	payload: SwitchModalPayload;
	needAccount?: IGenericAccount;
	onConfirm: (result: boolean) => void;
}

export function SwitchModal({ wallet, payload, needAccount, onConfirm }: SwitchModalProps) {
	const [error, setError] = useState('');

	useEffect(() => {
		function handleAccountUpdate(account: IGenericAccount | null) {
			if (!account) return;

			if (!needAccount || account.address === needAccount.address) {
				onConfirm(true);
			} else {
				setError('Wrong account 😒 Please try again.');
			}
		}

		wallet.on('accountUpdate', handleAccountUpdate);

		requestWalletAuthentication(wallet);

		return () => {
			wallet.off('accountUpdate', handleAccountUpdate);
		};
	}, [needAccount, onConfirm, wallet]);

	return (
		<>
			{wallet.wallet !== 'everwallet' && (
				<ActionModal title="Switch account" onClose={() => onConfirm(false)}>
					{payload.mode === SwitchModalMode.CURRENT_ACCOUNT_ALREADY_CONNECTED && (
						<>
							<WalletTag wallet={wallet.wallet} />

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
	export function show(wallet: Wallet, payload: SwitchModalPayload) {
		return showStaticComponent<boolean>(resolve => (
			<SwitchModal wallet={wallet} payload={payload} onConfirm={resolve} />
		));
	}
}
