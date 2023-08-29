import {
	EVM_NAMES,
	EVMNetwork,
	EVMWalletController,
	IEVMMailerContractLink,
	IEVMRegistryContractLink,
} from '@ylide/ethereum';
import clsx from 'clsx';
import { FC, useCallback, useState } from 'react';

import { AccountSelect } from '../../../components/accountSelect/accountSelect';
import { ActionButton } from '../../../components/ActionButton/ActionButton';
import { Modal } from '../../../components/modal/modal';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import domain from '../../../stores/Domain';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { blockchainMeta } from '../../../utils/blockchain';
import css from './deployModal.module.scss';

export interface EVMDeployContractModalProps {
	contract: { title: string; contract: IEVMMailerContractLink | IEVMRegistryContractLink | undefined };
	isModern: boolean;
	network: EVMNetwork;
	onClose: () => void;
}

export const EVMDeployContractModal: FC<EVMDeployContractModalProps> = ({ contract, isModern, network, onClose }) => {
	const [account, setAccount] = useState<DomainAccount>(domain.accounts.accounts[0]);
	const [loading, setLoading] = useState(false);
	const [address, setAddress] = useState('');

	const deployContract = useCallback(async () => {
		setLoading(true);
		let address: string = '';
		if (contract.title === 'MailerV6') {
			address = await (account.wallet.controller as EVMWalletController).deployMailerV6(account.account, {
				network,
			});
		} else if (contract.title === 'MailerV7') {
			address = await (account.wallet.controller as EVMWalletController).deployMailerV7(account.account, {
				network,
			});
		} else if (contract.title === 'MailerV8') {
			address = await (account.wallet.controller as EVMWalletController).deployMailerV8(account.account, {
				network,
			});
		} else if (contract.title === 'MailerV9') {
			address = await (account.wallet.controller as EVMWalletController).deployMailerV9(account.account, {
				network,
			});
		} else if (contract.title === 'RegistryV3') {
			address = await (account.wallet.controller as EVMWalletController).deployRegistryV3(
				account.account,
				undefined,
				{
					network,
				},
			);
		} else if (contract.title === 'RegistryV5') {
			address = await (account.wallet.controller as EVMWalletController).deployRegistryV5(
				account.account,
				undefined,
				{
					network,
				},
			);
		} else if (contract.title === 'RegistryV6') {
			address = await (account.wallet.controller as EVMWalletController).deployRegistryV6(account.account, {
				network,
			});
		}
		setAddress(address);
	}, [account, contract, network]);

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.title}>Deploy smart contract</div>
			<div className={css.description}>
				Enter all necessary data for constructor, select wallet and deploy smart contract
			</div>
			<div className={css.row}>
				<div className={css.label}>Network</div>
				<div className={css.value}>
					{blockchainMeta[EVM_NAMES[network]].logo(14)}{' '}
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
					<AccountSelect activeAccount={account} onChange={setAccount} />
				</div>
			</div>
			<div className={css.divider} />
			{address ? (
				<div className={css.row}>
					<div className={css.label}>Deployed address</div>
					<div className={css.value}>{address.toLowerCase()}</div>
				</div>
			) : (
				<div className={css.actionRow}>
					<ActionButton isDisabled={loading} onClick={deployContract}>
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
					</ActionButton>
				</div>
			)}
		</Modal>
	);
};
