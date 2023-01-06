import { EthereumWalletController, EVMNetwork } from '@ylide/ethereum';
import { Spin } from 'antd';
import { autobind } from 'core-decorators';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import { YlideButton } from '../../controls/YlideButton';
import domain from '../../stores/Domain';

@observer
export class AdminPage extends PureComponent {
	constructor(props: any) {
		super(props);

		makeObservable(this);
	}

	@observable deployingRegistryV5 = false;
	@observable changingBonucerRegistryV5 = false;
	@observable changingBonucesRegistryV5 = false;
	@observable registryV5Address = '';

	selectedChain: EVMNetwork.GNOSIS | EVMNetwork.POLYGON | EVMNetwork.FANTOM = EVMNetwork.FANTOM;

	@autobind
	async deployRegistryV5() {
		this.deployingRegistryV5 = true;
		this.registryV5Address = await (
			domain.walletControllers.evm.metamask as EthereumWalletController
		).deployRegistryV5();
		this.deployingRegistryV5 = false;
	}

	@observable deployingMailerV7 = false;
	@observable mailerV7Address = '';

	@autobind
	async deployMailerV7() {
		this.deployingMailerV7 = true;
		this.mailerV7Address = await (
			domain.walletControllers.evm.metamask as EthereumWalletController
		).deployMailerV7();
		this.deployingMailerV7 = false;
	}

	@autobind
	async changeBonucerRegistryV5() {
		this.changingBonucerRegistryV5 = true;
		console.log(
			'result: ',
			await (domain.walletControllers.evm.metamask as EthereumWalletController).setBonucer(
				this.selectedChain,
				'0x15a33D60283e3D20751D6740162D1212c1ad2a2d'.toLowerCase(),
				'0xEbe8aab1C6d379D566e28fE4bC3fafcA79Ba3cFF'.toLowerCase(),
				true,
			),
		);
		this.changingBonucerRegistryV5 = false;
	}

	@autobind
	async changeBonucesRegistryV5() {
		this.changingBonucesRegistryV5 = true;
		const bonuces = {
			[EVMNetwork.GNOSIS]: '1500000000000000',
			[EVMNetwork.FANTOM]: '5000000000000000',
			[EVMNetwork.POLYGON]: '50000000000000000',
		};
		console.log(
			'result: ',
			await (domain.walletControllers.evm.metamask as EthereumWalletController).setBonuses(
				this.selectedChain,
				'0x15a33D60283e3D20751D6740162D1212c1ad2a2d'.toLowerCase(),
				bonuces[this.selectedChain], // newcomer: 0.001
				'0', // referrer: 0
			),
		);
		this.changingBonucesRegistryV5 = false;
	}

	render() {
		return (
			<div
				style={{
					padding: 30,
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						margin: 20,
						background: 'white',
						padding: 20,
						border: '1px solid #e0e0e0',
						boxShadow: '4px 4px 0px black',
						width: 400,
						borderRadius: 10,
					}}
				>
					<YlideButton onClick={this.deployRegistryV5}>
						{this.deployingRegistryV5 ? <Spin /> : 'Deploy Regsitry V5'}
					</YlideButton>
					<YlideButton onClick={this.changeBonucerRegistryV5}>
						{this.changingBonucerRegistryV5 ? <Spin /> : 'Change Bonucer Regsitry V5'}
					</YlideButton>
					<YlideButton onClick={this.changeBonucesRegistryV5}>
						{this.changingBonucesRegistryV5 ? <Spin /> : 'Change Bonuses Regsitry V5'}
					</YlideButton>
					<br />
					New contract address: {this.registryV5Address}
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						margin: 20,
						background: 'white',
						padding: 20,
						border: '1px solid #e0e0e0',
						boxShadow: '4px 4px 0px black',
						width: 400,
						borderRadius: 10,
					}}
				>
					<YlideButton onClick={this.deployMailerV7}>
						{this.deployingMailerV7 ? <Spin /> : 'Deploy Mailer V7'}
					</YlideButton>
					<br />
					New contract address: {this.mailerV7Address}
				</div>
			</div>
		);
	}
}
