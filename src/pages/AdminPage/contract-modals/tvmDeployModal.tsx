import { EverscaleWalletController, ITVMMailerContractLink, ITVMRegistryContractLink } from '@ylide/everscale';
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

export interface TVMDeployContractModalProps {
	contract: { title: string; contract: ITVMMailerContractLink | ITVMRegistryContractLink | undefined };
	isModern: boolean;
	dev: boolean;
	onClose: () => void;
}

export const TVMDeployContractModal: FC<TVMDeployContractModalProps> = ({ contract, isModern, dev, onClose }) => {
	const [account, setAccount] = useState<DomainAccount>(domain.accounts.accounts[0]);
	const [loading, setLoading] = useState(false);
	const [address, setAddress] = useState('');

	const deployContract = useCallback(async () => {
		setLoading(true);
		let address: string = '';
		if (contract.title === 'MailerV5') {
			address = await (account.wallet.controller as any as EverscaleWalletController).deployMailerV5(
				account.account,
				account.account.address,
			);
		} else if (contract.title === 'MailerV6') {
			address = await (account.wallet.controller as any as EverscaleWalletController).deployMailerV6(
				account.account,
				account.account.address,
			);
		} else if (contract.title === 'RegistryV1') {
			address = await (account.wallet.controller as any as EverscaleWalletController).deployRegistryV1(
				account.account,
			);
		} else if (contract.title === 'RegistryV2') {
			address = await (account.wallet.controller as any as EverscaleWalletController).deployRegistryV2(
				account.account,
			);
		} else setAddress(address);
	}, [account, contract]);

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.title}>Deploy smart contract</div>
			<div className={css.description}>
				Enter all necessary data for constructor, select wallet and deploy smart contract
			</div>
			<div className={css.row}>
				<div className={css.label}>Network</div>
				<div className={css.value}>
					{blockchainsMap.everscale.logo(14)}{' '}
					<span className={css.blockchainName}>{dev ? 'Everscale Local' : 'Everscale Mainnet'}</span>
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
						href={`https://github.com/ylide-io/everscale-contracts/blob/main/contracts/Ylide${contract.title}.sol`}
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
			{address ? (
				<div className={css.row}>
					<div className={css.label}>Deployed address</div>
					<div className={css.value}>{address}</div>
				</div>
			) : (
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
			)}
		</Modal>
	);
};
