import {
	EVM_CONTRACTS,
	EVM_NAMES,
	EVMMailerContractType,
	EVMNetwork,
	EVMRegistryContractType,
	IEVMMailerContractLink,
	IEVMRegistryContractLink,
} from '@ylide/ethereum';
import {
	EVERSCALE_LOCAL,
	EVERSCALE_MAINNET,
	ITVMMailerContractLink,
	ITVMRegistryContractLink,
	TVMMailerContractType,
	TVMRegistryContractType,
} from '@ylide/everscale';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { FC, PureComponent, useState } from 'react';

import { AdaptiveAddress } from '../../components/adaptiveAddress/adaptiveAddress';
import { blockchainMeta, evmNameToNetwork } from '../../utils/blockchain';
import css from './adminPage.module.scss';
import { EVMDeployContractModal } from './contract-modals/evmDeployModal';
import { EVMRegistryV6Modal } from './contract-modals/EVMRegistryV6Modal';
import { TVMDeployContractModal } from './contract-modals/tvmDeployModal';

export interface EthereumContractPlateProps {
	network: EVMNetwork;
	contract: { title: string; contract: IEVMMailerContractLink | IEVMRegistryContractLink | undefined };
	isModern: boolean;
}

export const EthereumContractPlate: FC<EthereumContractPlateProps> = ({ contract, isModern, network }) => {
	const [deployModalVisible, setDeployModalVisible] = useState(false);
	const [manageModalVisible, setManageModalVisible] = useState(false);

	const name = EVM_NAMES[network];
	const scan = blockchainMeta[name].ethNetwork!.blockExplorerUrls[0]!;

	const isDeployed = !!contract.contract;
	const isVerified = contract.contract && contract.contract.verified;

	return (
		<>
			{deployModalVisible && (
				<EVMDeployContractModal
					contract={contract}
					network={network}
					isModern={isModern}
					onClose={() => setDeployModalVisible(false)}
				/>
			)}
			{manageModalVisible && (
				<EVMRegistryV6Modal
					contract={contract as any}
					network={network}
					isModern={isModern}
					onClose={() => setManageModalVisible(false)}
				/>
			)}
			<div
				key={contract.title}
				className={clsx(css.contractItem, {
					[css.notDeployed]: !isDeployed,
					[css.mostModern]: isModern,
					[css.notVerified]: !isVerified,
				})}
				onClick={() => (isDeployed ? setManageModalVisible(true) : setDeployModalVisible(true))}
			>
				<div className={css.contractTitle}>
					<div className={css.contractName}>
						{contract.contract && !contract.contract.verified ? (
							<Tooltip title="Code not verified on scanner">{contract.title}</Tooltip>
						) : (
							contract.title
						)}
					</div>
					<div className={css.contractAddress}>
						{contract.contract ? (
							<a
								href={`${scan}/address/${contract.contract.address.toLowerCase()}`}
								target="_blank"
								rel="noreferrer"
							>
								<AdaptiveAddress textAlign="right" address={contract.contract.address} />
							</a>
						) : (
							''
						)}
					</div>
				</div>
				<div className={css.contractStatus}>
					<div className={css.contractCreationBlock}>
						{contract.contract ? `Creation: ${contract.contract.creationBlock}` : `Not deployed`}
					</div>
					<div className={css.contractTerminationBlock}>{contract.contract ? `Active` : ``}</div>
				</div>
			</div>
		</>
	);
};

export interface EverscaleContractPlateProps {
	dev: boolean;
	contract: { title: string; contract: ITVMMailerContractLink | ITVMRegistryContractLink | undefined };
	isModern: boolean;
}

export const EverscaleContractPlate: FC<EverscaleContractPlateProps> = ({ contract, isModern, dev }) => {
	const [deployModalVisible, setDeployModalVisible] = useState(false);
	const [,] = useState(false);

	const scan = dev ? '#' : 'https://ever.live/accounts/accountDetails?id=';

	const isDeployed = !!contract.contract;
	const isVerified = contract.contract && contract.contract.verified;

	return (
		<>
			{deployModalVisible && (
				<TVMDeployContractModal
					contract={contract}
					dev={dev}
					isModern={isModern}
					onClose={() => setDeployModalVisible(false)}
				/>
			)}
			<div
				key={contract.title}
				className={clsx(css.contractItem, {
					[css.notDeployed]: !isDeployed,
					[css.mostModern]: isModern,
					[css.notVerified]: !isVerified,
				})}
				onClick={() => (isDeployed ? setDeployModalVisible(true) : setDeployModalVisible(true))}
			>
				<div className={css.contractTitle}>
					<div className={css.contractName}>
						{contract.contract && !contract.contract.verified ? (
							<Tooltip title="Code not verified on scanner">{contract.title}</Tooltip>
						) : (
							contract.title
						)}
					</div>
					<div className={css.contractAddress}>
						{contract.contract ? (
							<a
								href={`${scan}${contract.contract.address.toLowerCase()}`}
								target="_blank"
								rel="noreferrer"
							>
								<AdaptiveAddress textAlign="right" address={contract.contract.address} />
							</a>
						) : (
							''
						)}
					</div>
				</div>
				<div className={css.contractStatus}>
					<div className={css.contractCreationBlock}>{contract.contract ? `Deployed` : `Not deployed`}</div>
					<div className={css.contractTerminationBlock}>{contract.contract ? `Not terminated` : ``}</div>
				</div>
			</div>
		</>
	);
};

export class EthereumContractsRow extends PureComponent<{ network: EVMNetwork }> {
	render() {
		const { network } = this.props;
		const name = EVM_NAMES[network];

		const mostModernRegistry = 'RegistryV6';
		const mostModernMailer = 'MailerV8';

		const registryV3 = {
			title: 'RegistryV3',
			contract: EVM_CONTRACTS[network].registryContracts.find(
				r => r.type === EVMRegistryContractType.EVMRegistryV3,
			),
		};
		const registryV4 = {
			title: 'RegistryV4',
			contract: EVM_CONTRACTS[network].registryContracts.find(
				r => r.type === EVMRegistryContractType.EVMRegistryV4,
			),
		};
		const registryV5 = {
			title: 'RegistryV5',
			contract: EVM_CONTRACTS[network].registryContracts.find(
				r => r.type === EVMRegistryContractType.EVMRegistryV5,
			),
		};
		const registryV6 = {
			title: 'RegistryV6',
			contract: EVM_CONTRACTS[network].registryContracts.find(
				r => r.type === EVMRegistryContractType.EVMRegistryV6,
			),
		};

		const mailerV6 = {
			title: 'MailerV6',
			contract: EVM_CONTRACTS[network].mailerContracts.find(r => r.type === EVMMailerContractType.EVMMailerV6),
		};
		const mailerV7 = {
			title: 'MailerV7',
			contract: EVM_CONTRACTS[network].mailerContracts.find(r => r.type === EVMMailerContractType.EVMMailerV7),
		};
		const mailerV8 = {
			title: 'MailerV8',
			contract: EVM_CONTRACTS[network].mailerContracts.find(r => r.type === EVMMailerContractType.EVMMailerV8),
		};

		const contractGroups: {
			title: string;
			contracts: {
				title: string;
				contract: IEVMMailerContractLink | IEVMRegistryContractLink | undefined;
			}[];
		}[] = [
			{ title: 'Registry', contracts: [registryV6, registryV5, registryV4, registryV3] },
			{ title: 'Mailer', contracts: [mailerV8, mailerV7, mailerV6] },
		];

		return (
			<div className={css.networkItem}>
				<div className={css.networkTitle}>
					<div className={css.networkLogo}>{blockchainMeta[name].logo(30)}</div>
					<div className={css.networkName}>{blockchainMeta[name].title}</div>
				</div>
				{contractGroups.map(group => (
					<div
						key={group.title}
						className={css.contractsGroup}
						style={{
							backgroundColor:
								group.title === 'Registry' ? 'rgba(255, 245, 202, 0.6)' : 'rgba(202, 245, 255, 0.6)',
						}}
					>
						{group.contracts.map(
							(
								c, // <Modal className={css.root} onClose={onClose}>
							) => (
								<EthereumContractPlate
									key={c.title}
									contract={c}
									network={network}
									isModern={c.title === mostModernMailer || c.title === mostModernRegistry}
								/>
							),
						)}
					</div>
				))}
			</div>
		);
	}
}

export class EverscaleContractsRow extends PureComponent<{ dev: boolean }> {
	render() {
		const { dev } = this.props;
		const name = dev ? 'everscale' : 'everscale';

		const contracts = dev ? EVERSCALE_LOCAL : EVERSCALE_MAINNET;

		const mostModernRegistry = 'RegistryV2';
		const mostModernMailer = 'MailerV6';

		const registryV1 = {
			title: 'RegistryV1',
			contract: contracts.registryContracts.find(r => r.type === TVMRegistryContractType.TVMRegistryV1),
		};
		const registryV2 = {
			title: 'RegistryV2',
			contract: contracts.registryContracts.find(r => r.type === TVMRegistryContractType.TVMRegistryV2),
		};

		const mailerV5 = {
			title: 'MailerV5',
			contract: contracts.mailerContracts.find(r => r.type === TVMMailerContractType.TVMMailerV5),
		};
		const mailerV6 = {
			title: 'MailerV6',
			contract: contracts.mailerContracts.find(r => r.type === TVMMailerContractType.TVMMailerV6),
		};

		const contractGroups: {
			title: string;
			contracts: {
				title: string;
				contract: ITVMMailerContractLink | ITVMRegistryContractLink | undefined;
			}[];
		}[] = [
			{ title: 'Registry', contracts: [registryV2, registryV1] },
			{ title: 'Mailer', contracts: [mailerV6, mailerV5] },
		];

		return (
			<div className={css.networkItem}>
				<div className={css.networkTitle}>
					<div className={css.networkLogo}>{blockchainMeta[name].logo(30)}</div>
					<div className={css.networkName}>{blockchainMeta[name].title}</div>
				</div>
				{contractGroups.map(group => (
					<div
						key={group.title}
						className={css.contractsGroup}
						style={{
							backgroundColor:
								group.title === 'Registry' ? 'rgba(255, 245, 202, 0.6)' : 'rgba(202, 245, 255, 0.6)',
						}}
					>
						{group.contracts.map(
							(
								c, // <Modal className={css.root} onClose={onClose}>
							) => (
								<EverscaleContractPlate
									key={c.title}
									contract={c}
									dev={dev}
									isModern={c.title === mostModernMailer || c.title === mostModernRegistry}
								/>
							),
						)}
					</div>
				))}
			</div>
		);
	}
}

@observer
export class AdminPage extends PureComponent {
	render() {
		const networks = Object.keys(blockchainMeta); // .filter(e => e !== 'LOCAL_HARDHAT');

		const groups = [
			{
				title: 'EVM',
				blockchains: networks.filter(n => !!blockchainMeta[n].ethNetwork),
			},
			{
				title: 'Everscale',
				blockchains: networks.filter(n => n === 'everscale'),
			},
			{
				title: 'Solana',
				blockchains: networks.filter(n => n === 'solana'),
			},
			{
				title: 'Near',
				blockchains: networks.filter(n => n === 'near'),
			},
		];

		return (
			<div
				style={{
					padding: 20,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'stretch',
					justifyContent: 'flex-start',
				}}
			>
				<h2 style={{ fontSize: 26, marginBottom: 30 }}>Ylide Contract Management Console</h2>
				{groups.map(group => (
					<div key={group.title}>
						<h3
							style={{
								fontSize: 22,
								marginBottom: 20,
							}}
						>
							{group.title}
						</h3>
						<div className={css.networksList}>
							{group.blockchains.map(network =>
								group.title === 'EVM' ? (
									<EthereumContractsRow key={network} network={evmNameToNetwork(network)!} />
								) : group.title === 'Everscale' ? (
									<EverscaleContractsRow key={network} dev={network === 'Everscale'} />
								) : (
									<div key={network}>Not implemented</div>
								),
							)}
						</div>
					</div>
				))}
			</div>
		);
	}
}
