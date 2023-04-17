import { EVMNetwork } from '@ylide/ethereum';
import { IGenericAccount } from '@ylide/sdk';
import clsx from 'clsx';

import domain from '../../stores/Domain';
import { evmBalances } from '../../stores/evmBalances';
import { Wallet } from '../../stores/models/Wallet';
import { blockchainMeta, evmNameToNetwork } from '../../utils/blockchain';
import { Modal } from '../modal/modal';
import { WalletTag } from '../walletTag/walletTag';

const txPrices: Record<EVMNetwork, number> = {
	[EVMNetwork.LOCAL_HARDHAT]: 0.001,
	[EVMNetwork.ETHEREUM]: 0.001,
	[EVMNetwork.BNBCHAIN]: 0.001,
	[EVMNetwork.POLYGON]: 0.001,
	[EVMNetwork.ARBITRUM]: 0.001,
	[EVMNetwork.OPTIMISM]: 0.001,
	[EVMNetwork.AVALANCHE]: 0.001,
	[EVMNetwork.FANTOM]: 0.001,
	[EVMNetwork.KLAYTN]: 0.001,
	[EVMNetwork.GNOSIS]: 0.001,
	[EVMNetwork.AURORA]: 0.001,
	[EVMNetwork.CELO]: 0.001,
	[EVMNetwork.CRONOS]: 0.001,
	[EVMNetwork.MOONBEAM]: 0.001,
	[EVMNetwork.MOONRIVER]: 0.001,
	[EVMNetwork.METIS]: 0.001,
	[EVMNetwork.ASTAR]: 0.001,
};

//

export interface SelectNetworkModalProps {
	wallet: Wallet;
	account: IGenericAccount;
	onSelect?: (network: EVMNetwork) => void;
	onCancel?: () => void;
}

export function SelectNetworkModal({ wallet, account, onSelect, onCancel }: SelectNetworkModalProps) {
	return (
		<Modal className="account-modal wallet-modal" onClose={() => onCancel?.()}>
			<div
				style={{
					padding: 24,
					paddingTop: 12,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<WalletTag wallet={wallet.factory.wallet} address={account.address} />
			</div>

			<h3 className="wm-title">Choose network</h3>

			<div
				className="wm-body"
				style={{
					marginTop: -24,
					paddingTop: 24,
					marginLeft: -24,
					marginRight: -24,
					paddingLeft: 24,
					paddingRight: 24,
					overflowY: 'scroll',
					maxHeight: 390,
				}}
			>
				{domain.registeredBlockchains
					.filter(f => f.blockchainGroup === 'evm')
					.sort((a, b) => {
						const aBalance = Number(evmBalances.balances[evmNameToNetwork(a.blockchain)!].toFixed(4));
						const bBalance = Number(evmBalances.balances[evmNameToNetwork(b.blockchain)!].toFixed(4));
						const aTx = txPrices[evmNameToNetwork(a.blockchain)!];
						const bTx = txPrices[evmNameToNetwork(b.blockchain)!];
						if (aBalance === bBalance) {
							return aTx - bTx;
						} else {
							return bBalance - aBalance;
						}
					})
					.map((bc, idx) => {
						const bData = blockchainMeta[bc.blockchain];
						return (
							<div
								className={clsx('wmn-plate', {
									disabled:
										Number(evmBalances.balances[evmNameToNetwork(bc.blockchain)!].toFixed(4)) === 0,
								})}
								onClick={() => onSelect?.(evmNameToNetwork(bc.blockchain)!)}
							>
								<div className="wmn-icon">{bData.logo(32)}</div>
								<div className="wmn-title">
									<div className="wmn-blockchain">{bData.title}</div>
									{Number(evmBalances.balances[evmNameToNetwork(bc.blockchain)!].toFixed(4)) > 0 &&
									idx === 0 ? (
										<div className="wmn-optimal">Optimal</div>
									) : null}
								</div>
								<div className="wmn-balance">
									<div className="wmn-wallet-balance">
										{Number(evmBalances.balances[evmNameToNetwork(bc.blockchain)!].toFixed(4))}{' '}
										{bData.ethNetwork?.nativeCurrency.symbol || 'ETH'}
									</div>
									<div className="wmn-transaction-price">
										Transaction = 0.0004 {bData.ethNetwork?.nativeCurrency.symbol || 'ETH'}
									</div>
								</div>
							</div>
						);
					})}
			</div>
		</Modal>
	);
}
