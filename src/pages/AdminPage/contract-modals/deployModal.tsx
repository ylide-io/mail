import {
	EthereumWalletController,
	EVM_NAMES,
	EVMNetwork,
	IEVMMailerContractLink,
	IEVMRegistryContractLink,
} from '@ylide/ethereum';
import clsx from 'clsx';
import { FC, useCallback, useState } from 'react';

import { AccountSelect } from '../../../components/accountSelect/accountSelect';
import { Modal } from '../../../components/modal/modal';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { blockchainsMap } from '../../../constants';
import { YlideButton } from '../../../controls/YlideButton';
import domain from '../../../stores/Domain';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import css from './deployModal.module.scss';

export interface DeployContractModalProps {
	contract: { title: string; contract: IEVMMailerContractLink | IEVMRegistryContractLink | undefined };
	isModern: boolean;
	network: EVMNetwork;
	onClose: () => void;
}

export const DeployContractModal: FC<DeployContractModalProps> = ({ contract, isModern, network, onClose }) => {
	const [account, setAccount] = useState<DomainAccount>(domain.accounts.activeAccounts[0]);
	const [loading, setLoading] = useState(false);

	const deployContract = useCallback(async () => {
		setLoading(true);
		(account.wallet.controller as EthereumWalletController).addressToUint256('');
	}, [account]);

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.title}>Deploy smart contract</div>
			<div className={css.description}>
				Enter all necessary data for constructor, select wallet and deploy smart contract
			</div>
			<div className={css.row}>
				<div className={css.label}>Network</div>
				<div className={css.value}>
					{blockchainsMap[EVM_NAMES[network]].logo(14)}{' '}
					<span className={css.blockchainName}>{EVM_NAMES[network]}</span>
				</div>
			</div>
			<div className={css.row}>
				<div className={css.label}>Contract</div>
				<div className={clsx(css.value, css.withModificator)}>
					{contract.title}
					<span className={isModern ? css.modernContract : css.oldContract}>
						{isModern ? 'Modern' : 'Deprecated'}
					</span>
				</div>
			</div>
			<div className={css.row}>
				<div className={css.label}>Source code</div>
				<div className={css.value}>
					<a
						href={`https://github.com/ylide-io/ethereum-contracts/blob/main/contracts/Ylide${contract.title}.sol`}
						target="_blank"
						rel="noreferrer"
					>
						View on GitHub
					</a>
				</div>
			</div>
			<div className={css.row}>
				<div className={css.label}>Deployer wallet</div>
				<div className={css.value}>
					<AccountSelect activeAccount={account} onChange={account => setAccount(account)} />
				</div>
			</div>
			<div className={css.divider} />
			<div className={css.actionRow}>
				<YlideButton className={clsx({ [css.disabled]: loading })} onClick={deployContract}>
					{loading ? (
						<div style={{ display: 'flex', flexDirection: 'row' }}>
							<div style={{ zoom: '0.25' }}>
								<YlideLoader />
							</div>
							<div style={{ marginLeft: 6 }}>Deploying...</div>
						</div>
					) : (
						'Deploy'
					)}
				</YlideButton>
			</div>
		</Modal>
	);
};
