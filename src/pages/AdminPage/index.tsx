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

	selectedChain: EVMNetwork.GNOSIS | EVMNetwork.POLYGON | EVMNetwork.FANTOM = EVMNetwork.POLYGON;

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
		const sb = async (a: string) =>
			console.log(
				'result: ',
				await (domain.walletControllers.evm.metamask as EthereumWalletController).setBonucer(
					this.selectedChain,
					'0x15a33D60283e3D20751D6740162D1212c1ad2a2d'.toLowerCase(),
					a.toLowerCase(),
					true,
				),
			);

		// await sb('0x2D15daF82b187f022348456ae4fbF4ffe40f1F72');
		// await sb('0x0C386867628470786A90fd88809dAfb7ca1d3173');
		// await sb('0x5D929f09db6E328fbE08f032AA6A784925bFCC35');
		// await sb('0x157C7280d709CF24f52786Cd9A5aEC429c3b92cF');
		// await sb('0xef26583C8C53B92fA1F052bE8ef23b896680Be51');
		// await sb('0x9CEc8BFc69F890BAfeF7E6Cca091a10449618b6f');
		// await sb('0xC5741b5Fe4a9a4899fb35B4884a55933541b0Ec4');
		// await sb('0xd143358374AE027d82ed8176F6192e09fFaA9Ce6');
		// await sb('0x76Fdf77758C5A0579809417C44555Cdc623345d4');
		// await sb('0x1855A04623511B5bE555CaD56D4532D873cF6700');
		// await sb('0x85E1438bAa18c9C0aFC4F5e54ff88F4a271AD337');
		// await sb('0x0EB0a61A6aD78911A38F1b33BA94f65f3C3eB633');
		// await sb('0x739C62cDC2dC3Cf4639E00d3f327fD48987C7221');
		// await sb('0xD079915b8EB369C889fDFa6A3CAb29e7A0407efe');
		// await sb('0x1888f1d499604316F96Ee5E8cEe03D5a2Ac0A702');
		// await sb('0x58C8fa5806C27D9fC7363951686F615dB54C096f');
		// await sb('0x1F094c8719F777D2543Db6744cE12df9B7466414');
		// await sb('0xEAe0a0C374933dbCd3bC882c0e2a74F922849bD6');
		// await sb('0x0F65679859bE0CAF3Cda34eBb8eB6eD80aa66A8F');

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
