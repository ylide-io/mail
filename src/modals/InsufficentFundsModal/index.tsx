import { observer } from 'mobx-react';
import { PureComponent } from 'react';
import modals from '../../stores/Modals';
import { autobind } from 'core-decorators';
import { makeObservable, observable } from 'mobx';
import { DomainAccount } from '../../stores/models/DomainAccount';
import YlideModal from '../YlideModal';
import domain from '../../stores/Domain';

export interface InsufficentFundsModalProps {
	account: DomainAccount;
	text: string;
	onConfirm: (tryAgain: boolean) => void;
}

@observer
export default class InsufficentFundsModal extends PureComponent<InsufficentFundsModalProps> {
	static async show(account: DomainAccount, text: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			modals.show((close: () => void) => (
				<InsufficentFundsModal
					account={account}
					text={text}
					onConfirm={result => {
						close();
						resolve(result);
					}}
				/>
			));
		});
	}

	@observable currentNetwork: string = '';
	@observable availableNetworks: string[] = [];
	@observable balances: Record<string, number> = {};
	@observable loading = false;
	@observable loaded = false;

	constructor(props: InsufficentFundsModalProps) {
		super(props);

		makeObservable(this);
	}

	@autobind
	handleNetworkUpdate(network: string) {
		this.currentNetwork = network;
	}

	async load() {
		this.loading = true;
		try {
			this.currentNetwork = await this.props.account.wallet.controller.getCurrentBlockchain();
			this.availableNetworks = domain.registeredBlockchains
				.filter(b => b.blockchainGroup === this.props.account.wallet.factory.blockchainGroup)
				.map(b => b.blockchain);
			const newBalancesString = await this.props.account.getBalances();
			const newBalances: Record<string, number> = {};
			for (const blockchain in newBalancesString) {
				newBalances[blockchain] = Number(newBalancesString[blockchain]);
			}
		} finally {
			this.loading = false;
		}
	}

	componentWillUnmount(): void {
		this.props.account.wallet.off('networkUpdate', this.handleNetworkUpdate);
	}

	componentDidMount(): void {
		this.props.account.wallet.on('chainUpdate', this.handleNetworkUpdate);
		this.load();
	}

	render() {
		return (
			<YlideModal>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
					We noticed that
					<table>
						<thead>
							<tr>
								<th>Blockchain</th>
								<th>Your balance</th>
							</tr>
						</thead>
						<tbody>
							{Object.keys(this.balances).map(blockchain => (
								<tr key={blockchain}>
									<td>{blockchain}</td>
									<td>{this.balances[blockchain]}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</YlideModal>
		);
	}
}
