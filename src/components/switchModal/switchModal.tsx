import { IGenericAccount } from '@ylide/sdk';
import { useEffect, useState } from 'react';

import { Wallet } from '../../stores/models/Wallet';
import { requestSwitchAccount } from '../../utils/account';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { BlockChainLabel } from '../BlockChainLabel/BlockChainLabel';
import { GridRowBox } from '../boxes/boxes';
import { ErrorMessage } from '../errorMessage/errorMessage';
import { Spinner } from '../spinner/spinner';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import { WalletTag } from '../walletTag/walletTag';

interface SwitchModalProps {
	type: 'account' | 'network';
	wallet: Wallet;
	needAccount?: IGenericAccount;
	needNetwork?: string;
	onConfirm: (result: boolean) => void;
}

export function SwitchModal({ type, wallet, needAccount, needNetwork, onConfirm }: SwitchModalProps) {
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

		function handleNetworkUpdate(network: string) {
			if (!needNetwork || network === needNetwork) {
				onConfirm(true);
			} else {
				setError('Wrong network 😒 Please try again.');
			}
		}

		if (type === 'account') {
			wallet.on('accountUpdate', handleAccountUpdate);
		} else {
			wallet.on('chainUpdate', handleNetworkUpdate);
		}

		requestSwitchAccount(wallet);

		return () => {
			if (type === 'account') {
				wallet.off('accountUpdate', handleAccountUpdate);
			} else {
				wallet.off('chainUpdate', handleNetworkUpdate);
			}
		};
	}, [needAccount, needNetwork, onConfirm, type, wallet]);

	return (
		<>
			{wallet.wallet !== 'everwallet' && (
				<ActionModal title="Activate account" onClose={() => onConfirm(false)}>
					{needAccount && <WalletTag wallet={wallet.wallet} address={needAccount.address} />}

					{needNetwork && (
						<GridRowBox>
							Network
							<BlockChainLabel blockchain={needNetwork} />
						</GridRowBox>
					)}

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
									requestSwitchAccount(wallet);
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
	export function show(
		type: 'account' | 'network',
		wallet: Wallet,
		needAccount?: IGenericAccount,
		needNetwork?: string,
	) {
		return showStaticComponent<boolean>(resolve => (
			<SwitchModal
				type={type}
				wallet={wallet}
				needAccount={needAccount}
				needNetwork={needNetwork}
				onConfirm={resolve}
			/>
		));
	}
}
