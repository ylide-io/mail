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

	@observable deployingRegistryV4 = false;
	@observable changingBonucerRegistryV4 = false;
	@observable registryV4Address = '';

	@autobind
	async deployRegistryV4() {
		this.deployingRegistryV4 = true;
		this.registryV4Address = await (
			domain.walletControllers.evm.metamask as EthereumWalletController
		).deployRegistryV4();
		this.deployingRegistryV4 = false;
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
	async changeBonucerRegistryV4() {
		this.changingBonucerRegistryV4 = true;
		debugger;
		console.log(
			'result: ',
			await (domain.walletControllers.evm.metamask as EthereumWalletController).changeBonucer(
				EVMNetwork.GNOSIS,
				'0x15a33D60283e3D20751D6740162D1212c1ad2a2d'.toLowerCase(),
				'0xEbe8aab1C6d379D566e28fE4bC3fafcA79Ba3cFF'.toLowerCase(),
			),
		);
		this.changingBonucerRegistryV4 = false;
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
					<YlideButton onClick={this.deployRegistryV4}>
						{this.deployingRegistryV4 ? <Spin /> : 'Deploy Regsitry V4'}
					</YlideButton>
					<YlideButton onClick={this.changeBonucerRegistryV4}>
						{this.changingBonucerRegistryV4 ? <Spin /> : 'Change Bonucer Regsitry V4'}
					</YlideButton>
					<br />
					New contract address: {this.registryV4Address}
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
