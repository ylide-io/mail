import {
	EVM_CONTRACTS,
	EVM_NAMES,
	EVMMailerContractType,
	EVMNetwork,
	EVMRegistryContractType,
	IEVMMailerContractLink,
	IEVMRegistryContractLink,
} from '@ylide/ethereum';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { FC, PureComponent, useState } from 'react';

import { blockchainsMap, evmNameToNetwork } from '../../constants';
import { AdaptiveAddress } from '../../controls/adaptiveAddress/adaptiveAddress';
import css from './adminPage.module.scss';
import { DeployContractModal } from './contract-modals/deployModal';

export interface EthereumContractPlateProps {
	network: EVMNetwork;
	contract: { title: string; contract: IEVMMailerContractLink | IEVMRegistryContractLink | undefined };
	isModern: boolean;
}

export const EthereumContractPlate: FC<EthereumContractPlateProps> = ({ contract, isModern, network }) => {
	const [deployModalVisible, setDeployModalVisible] = useState(false);
	const [, setManageModalVisible] = useState(false);

	const name = EVM_NAMES[network];
	const scan = blockchainsMap[name].ethNetwork!.blockExplorerUrls[0]!;

	const isDeployed = !!contract.contract;
	const isVerified = contract.contract && contract.contract.verified;

	return (
		<>
			{deployModalVisible && (
				<DeployContractModal
					contract={contract}
					network={network}
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
				r => r.type === EVMRegistryContractType.YlideRegistryV3,
			),
		};
		const registryV5 = {
			title: 'RegistryV5',
			contract: EVM_CONTRACTS[network].registryContracts.find(
				r => r.type === EVMRegistryContractType.YlideRegistryV5,
			),
		};
		const registryV6 = {
			title: 'RegistryV6',
			contract: EVM_CONTRACTS[network].registryContracts.find(
				r => r.type === EVMRegistryContractType.YlideRegistryV6,
			),
		};

		const mailerV6 = {
			title: 'MailerV6',
			contract: EVM_CONTRACTS[network].mailerContracts.find(r => r.type === EVMMailerContractType.YlideMailerV6),
		};
		const mailerV7 = {
			title: 'MailerV7',
			contract: EVM_CONTRACTS[network].mailerContracts.find(r => r.type === EVMMailerContractType.YlideMailerV7),
		};
		const mailerV8 = {
			title: 'MailerV8',
			contract: EVM_CONTRACTS[network].mailerContracts.find(r => r.type === EVMMailerContractType.YlideMailerV8),
		};

		const contractGroups: {
			title: string;
			contracts: {
				title: string;
				contract: IEVMMailerContractLink | IEVMRegistryContractLink | undefined;
			}[];
		}[] = [
			{ title: 'Registry', contracts: [registryV6, registryV5, registryV3] },
			{ title: 'Mailer', contracts: [mailerV8, mailerV7, mailerV6] },
		];

		return (
			<div className={css.networkItem}>
				<div className={css.networkTitle}>
					<div className={css.networkLogo}>{blockchainsMap[name].logo(30)}</div>
					<div className={css.networkName}>{blockchainsMap[name].title}</div>
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

@observer
export class AdminPage extends PureComponent {
	render() {
		const networks = Object.keys(blockchainsMap).filter(e => e !== 'LOCAL_HARDHAT');

		const groups = [
			{
				title: 'EVM',
				blockchains: networks.filter(n => !!blockchainsMap[n].ethNetwork),
			},
			{
				title: 'Everscale',
				blockchains: networks.filter(n => !blockchainsMap[n].ethNetwork),
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
