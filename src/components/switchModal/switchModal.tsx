import { IGenericAccount } from '@ylide/sdk';
import { useEffect, useState } from 'react';

import { Wallet } from '../../stores/models/Wallet';
import { requestWalletAuthentication } from '../../utils/account';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { GridRowBox } from '../boxes/boxes';
import { ErrorMessage } from '../errorMessage/errorMessage';
import { Spinner } from '../spinner/spinner';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import { WalletTag } from '../walletTag/walletTag';

interface SwitchModalProps {
	wallet: Wallet;
	needAccount?: IGenericAccount;
	onConfirm: (result: boolean) => void;
}

export function SwitchModal({ wallet, needAccount, onConfirm }: SwitchModalProps) {
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
				<ActionModal title="Activate account" onClose={() => onConfirm(false)}>
					{needAccount && <WalletTag wallet={wallet.wallet} address={needAccount.address} />}

					<div>
						Please unlock you wallet and make sure that both account and network are selected correctly.
					</div>

					{error ? (
						<>
							<ErrorMessage>{error}</ErrorMessage>

							<ActionButton
								size={ActionButtonSize.MEDIUM}
								look={ActionButtonLook.PRIMARY}
								onClick={() => {
									setError('');
									requestWalletAuthentication(wallet);
								}}
							>
								Try again
							</ActionButton>
						</>
					) : (
						<GridRowBox>
							<Spinner /> Opening wallet app ...
						</GridRowBox>
					)}
				</ActionModal>
			)}
		</>
	);
}

export namespace SwitchModal {
	export function show(wallet: Wallet, needAccount?: IGenericAccount) {
		return showStaticComponent<boolean>(resolve => (
			<SwitchModal wallet={wallet} needAccount={needAccount} onConfirm={resolve} />
		));
	}
}
