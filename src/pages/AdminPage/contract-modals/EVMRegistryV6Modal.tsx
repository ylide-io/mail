import {
	EVMBlockchainController,
	EVMRegistryV6Wrapper,
	EVMWalletController,
	EVM_CONTRACTS,
	EVM_NAMES,
	EVMNetwork,
	IEVMRegistryContractLink,
} from '@ylide/ethereum';
import clsx from 'clsx';
import { FC, useCallback, useEffect, useState } from 'react';

import { AccountSelect } from '../../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { Modal } from '../../../components/modal/modal';
import { Spinner } from '../../../components/spinner/spinner';
import { TextField } from '../../../components/textField/textField';
import domain from '../../../stores/Domain';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { blockchainMeta } from '../../../utils/blockchain';
import css from './deployModal.module.scss';

export interface EVMRegistryV6ModalProps {
	contract: { title: string; contract: IEVMRegistryContractLink | undefined };
	isModern: boolean;
	network: EVMNetwork;
	onClose: () => void;
}

export const EVMRegistryV6Modal: FC<EVMRegistryV6ModalProps> = ({ contract, isModern, network, onClose }) => {
	const [account, setAccount] = useState<DomainAccount>(domain.accounts.accounts[0]);
	const [loading, setLoading] = useState(true);
	const [params, setParams] = useState({
		owner: '',
		newcomerBonus: '',
		referrerBonus: '',
	});
	const [bonucerAddress, setBonucerAddress] = useState('');
	const [bonucerLoading, setBonucerLoading] = useState(false);
	const [changeBonucerLoading, setChangeBonucerLoading] = useState(false);
	const [isBonucer, setIsBonucer] = useState<null | true | false>(null);

	const name = EVM_NAMES[network];
	const scan = blockchainMeta[name].ethNetwork!.blockExplorerUrls[0]!;
	const symbol = blockchainMeta[name].ethNetwork!.nativeCurrency.symbol;

	const checkBonucer = useCallback(async () => {
		setBonucerLoading(true);
		const walletController = account.wallet.controller as EVMWalletController;
		const link = EVM_CONTRACTS[network].registryContracts.find(r => r.id === contract.contract?.id)!;
		const wrapper = new EVMBlockchainController.registryWrappers[link.type](
			walletController.blockchainReader,
		) as EVMRegistryV6Wrapper;
		const _isBonucer = await wrapper.getIsBonucer(link, bonucerAddress);
		setIsBonucer(_isBonucer);
		setBonucerLoading(false);
	}, [bonucerAddress, contract]);

	useEffect(() => {
		if (contract.contract) {
			(async () => {
				const walletController = account.wallet.controller as EVMWalletController;
				const link = EVM_CONTRACTS[network].registryContracts.find(r => r.id === contract.contract?.id)!;
				const wrapper = new EVMBlockchainController.registryWrappers[link.type](
					walletController.blockchainReader,
				) as EVMRegistryV6Wrapper;
				const owner = await wrapper.getOwner(link);
				const { newcomer, referrer } = await wrapper.getBonuces(link);
				setParams({
					owner,
					newcomerBonus: newcomer,
					referrerBonus: referrer,
				});
				setLoading(false);
			})();
		}
	}, [contract]);

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.title}>Manage RegistryV6</div>
			<div className={css.description}>
				Change owner, beneficiary, bonucers and other parameters of the RegistryV6 contract.
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
				<div className={css.label}>Bonuces</div>
				<div className={clsx(css.value, css.withModificator)}>
					{loading ? (
						<Spinner />
					) : (
						<>
							Newcomer: {parseFloat(params.newcomerBonus)} {symbol}
							<br />
							Referrer: {parseFloat(params.referrerBonus)} {symbol}
						</>
					)}
				</div>
			</div>
			<div className={css.divider} />
			<div className={css.row}>
				<div className={css.label}>Wallet</div>
				<div className={css.value}>
					<AccountSelect activeAccount={account} onChange={setAccount} />
				</div>
			</div>
			<div className={css.row}>
				<div className={css.label}>Bonucers</div>
				<div className={clsx(css.value, css.withModificator)}>
					<div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'stretch' }}>
						<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
							<TextField
								style={{ flexGrow: 1 }}
								value={bonucerAddress}
								onChange={e => setBonucerAddress(e.target.value)}
							/>
							<ActionButton
								onClick={async () => {
									checkBonucer();
								}}
							>
								{bonucerLoading ? <Spinner /> : 'Check'}
							</ActionButton>
						</div>
						{isBonucer !== null ? (
							<div style={{ marginTop: 6, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
								{isBonucer ? (
									<>
										It is bonucer{' '}
										<ActionButton
											style={{ marginLeft: 6 }}
											size={ActionButtonSize.SMALL}
											onClick={async () => {
												setChangeBonucerLoading(true);
												const walletController = account.wallet
													.controller as EVMWalletController;
												const link = EVM_CONTRACTS[network].registryContracts.find(
													r => r.id === contract.contract?.id,
												)!;
												const wrapper = new EVMBlockchainController.registryWrappers[
													link.type
												](walletController.blockchainReader) as EVMRegistryV6Wrapper;
												await wrapper.removeBonucer(
													link,
													walletController.signer,
													account.account.address,
													bonucerAddress,
												);
												setChangeBonucerLoading(false);
												setBonucerAddress('');
												setIsBonucer(null);
											}}
										>
											{changeBonucerLoading ? <Spinner /> : 'Remove'}
										</ActionButton>
									</>
								) : (
									<>
										It is not bonucer{' '}
										<ActionButton
											style={{ marginLeft: 6 }}
											size={ActionButtonSize.SMALL}
											onClick={async () => {
												setChangeBonucerLoading(true);
												const walletController = account.wallet
													.controller as EVMWalletController;
												const link = EVM_CONTRACTS[network].registryContracts.find(
													r => r.id === contract.contract?.id,
												)!;
												const wrapper = new EVMBlockchainController.registryWrappers[
													link.type
												](walletController.blockchainReader) as EVMRegistryV6Wrapper;
												await wrapper.addBonucer(
													link,
													walletController.signer,
													account.account.address,
													bonucerAddress,
												);
												setChangeBonucerLoading(false);
												setBonucerAddress('');
												setIsBonucer(null);
											}}
										>
											{changeBonucerLoading ? <Spinner /> : 'Add'}
										</ActionButton>
									</>
								)}
							</div>
						) : null}
					</div>
				</div>
			</div>
			{/* 
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
