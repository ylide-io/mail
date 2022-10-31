import { EthereumWalletController } from '@ylide/ethereum';
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

	@observable deployingRegistryV3 = false;
	@observable registryV3Address = '';

	@autobind
	async deployRegistryV3() {
		this.deployingRegistryV3 = true;
		this.registryV3Address = await (
			domain.walletControllers.evm.web3 as EthereumWalletController
		).deployRegistryV3();
		this.deployingRegistryV3 = false;
	}

	@observable deployingMailerV6 = false;
	@observable mailerV6Address = '';

	@autobind
	async deployMailerV6() {
		this.deployingMailerV6 = true;
		this.mailerV6Address = await (domain.walletControllers.evm.web3 as EthereumWalletController).deployMailerV6();
		this.deployingMailerV6 = false;
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
					<YlideButton onClick={this.deployRegistryV3}>
						{this.deployingRegistryV3 ? <Spin /> : 'Deploy Regsitry V3'}
					</YlideButton>
					<br />
					New contract address: {this.registryV3Address}
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
					<YlideButton onClick={this.deployMailerV6}>
						{this.deployingMailerV6 ? <Spin /> : 'Deploy Mailer V6'}
					</YlideButton>
					<br />
					New contract address: {this.mailerV6Address}
				</div>
			</div>
		);
	}
}
