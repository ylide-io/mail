import {
	EthereumMailerV8Wrapper,
	EthereumWalletController,
	EVM_NAMES,
	EVMNetwork,
	IEVMMailerContractLink,
	IEVMRegistryContractLink,
} from '@ylide/ethereum';
import clsx from 'clsx';
import { FC, useEffect, useState } from 'react';

import { Modal } from '../../../components/modal/modal';
import { Spinner } from '../../../components/spinner/spinner';
import domain from '../../../stores/Domain';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { blockchainMeta } from '../../../utils/blockchain';
import css from './deployModal.module.scss';

export interface EVMMailerV8ModalProps {
	contract: { title: string; contract: IEVMMailerContractLink | IEVMRegistryContractLink | undefined };
	isModern: boolean;
	network: EVMNetwork;
	onClose: () => void;
}

export const EVMMailerV8Modal: FC<EVMMailerV8ModalProps> = ({ contract, isModern, network, onClose }) => {
	const [account, setAccount] = useState<DomainAccount>(domain.accounts.accounts[0]);
	const [loading, setLoading] = useState(true);
	const [params, setParams] = useState({
		owner: '',
		beneficiary: '',
		fees: { recipientFee: '', contentPartFee: '', broadcastFee: '' },
		prices: { broadcastFeedCreationPrice: '', mailingFeedCreationPrice: '' },
	});

	useEffect(() => {
		if (contract.contract) {
			(async () => {
				const mailer = await (account.wallet.controller as EthereumWalletController).mailers.find(
					m => m.link.id === contract.contract?.id,
				)!;
				const wrapper = mailer.wrapper as EthereumMailerV8Wrapper;
				const owner = await wrapper.globals.getOwner(mailer.link);
				const beneficiary = await wrapper.globals.getBeneficiary(mailer.link);
				const fees = await wrapper.globals.getFees(mailer.link);
				const prices = await wrapper.globals.getPrices(mailer.link);
				setParams({
					owner,
					beneficiary,
					fees: {
						recipientFee: fees.recipientFee.toString(),
						contentPartFee: fees.contentPartFee.toString(),
						broadcastFee: fees.broadcastFee.toString(),
					},
					prices: {
						broadcastFeedCreationPrice: prices.broadcastFeedCreationPrice.toString(),
						mailingFeedCreationPrice: prices.mailingFeedCreationPrice.toString(),
					},
				});
				setLoading(false);
			})();
		}
	}, [contract]);

	const name = EVM_NAMES[network];
	const scan = blockchainMeta[name].ethNetwork!.blockExplorerUrls[0]!;

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.title}>Manage MailerV8</div>
			<div className={css.description}>
				Change owner, beneficiary, bonucers and other parameters of the MailerV8 contract.
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
				<div className={css.label}>Address</div>
				<div className={clsx(css.value, css.withModificator)}>
					<a href={`${scan}/address/${contract.contract!.address}`} target="_blank" rel="noreferrer">
						{contract.contract!.address}
					</a>
				</div>
			</div>
			<div className={css.row}>
				<div className={css.label}>Owner</div>
				<div className={clsx(css.value, css.withModificator)}>
					{loading ? (
						<Spinner />
					) : (
						<a href={`${scan}/address/${params.owner}`} target="_blank" rel="noreferrer">
							{params.owner}
						</a>
					)}
				</div>
			</div>
			<div className={css.row}>
				<div className={css.label}>Beneficiary</div>
				<div className={clsx(css.value, css.withModificator)}>
					{loading ? (
						<Spinner />
					) : (
						<a href={`${scan}/address/${params.beneficiary}`} target="_blank" rel="noreferrer">
							{params.beneficiary}
						</a>
					)}
				</div>
			</div>
			<div className={css.row}>
				<div className={css.label}>Fees</div>
				<div className={clsx(css.value, css.withModificator)}>
					{loading ? (
						<Spinner />
					) : (
						<>
							Fees
							<br />
							Fees
							<br />
							Fees
							<br />
							Fees
						</>
					)}
				</div>
			</div>
			<div className={css.row}>
				<div className={css.label}>Prices</div>
				<div className={clsx(css.value, css.withModificator)}>{loading ? <Spinner /> : <>Prices</>}</div>
			</div>
			{/* <div className={css.row}>
				<div className={css.label}>Deployer wallet</div>
				<div className={css.value}>
					<AccountSelect activeAccount={account} onChange={setAccount} />
				</div>
			</div>
			<div className={css.divider} /> */}

			{/* <div className={css.actionRow}>
					<ActionButton isMultiline isDisabled={loading} onClick={deployContract}>
						{loading ? (
							<div style={{ display: 'flex', flexDirection: 'row' }}>
								<div style={{ zoom: '0.25' }}>
									<YlideLoader />
								</div>
								<div style={{ marginLeft: 8 }}>Deploying...</div>
							</div>
						) : (
							'Deploy'
						)}
					</ActionButton>
				</div> */}
		</Modal>
	);
};
