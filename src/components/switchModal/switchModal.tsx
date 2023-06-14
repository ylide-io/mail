import { IGenericAccount } from '@ylide/sdk';
import { useEffect, useState } from 'react';

import { Wallet } from '../../stores/models/Wallet';
import { requestSwitchAccount } from '../../utils/account';
import { ActionModal } from '../actionModal/actionModal';
import { BlockChainLabel } from '../BlockChainLabel/BlockChainLabel';
import { GridRowBox } from '../boxes/boxes';
import { ErrorMessage } from '../errorMessage/errorMessage';
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
			if (needAccount !== undefined) {
				if (!account) {
					// requestSwitchAccount(wallet);
					// setError('You logged out...');
				} else if (account.address !== needAccount.address) {
					requestSwitchAccount(wallet);
					setError('Wrong account 😒 Please try again.');
				} else {
					onConfirm(true);
				}
			} else {
				if (account !== null) {
					onConfirm(true);
				} else {
					// requestSwitchAccount(wallet);
					// setError('You logged out...');
				}
			}
		}

		function handleNetworkUpdate(network: string) {
			if (needNetwork !== undefined) {
				if (network !== needNetwork) {
					requestSwitchAccount(wallet);
					setError('Wrong network 😒 Please try again.');
				} else {
					onConfirm(true);
				}
			} else {
				onConfirm(true);
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

					{error && <ErrorMessage>{error}</ErrorMessage>}

					<div>
						Please unlock you wallet and make sure that both account and network are selected correctly.
					</div>
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
