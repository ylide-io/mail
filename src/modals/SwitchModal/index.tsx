import { IGenericAccount } from '@ylide/sdk';
import Modal from 'antd/lib/modal/Modal';
import { autobind } from 'core-decorators';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import metamaskSwitchVideo from '../../assets/video/metamask-switch.mp4';
import { ErrorMessage } from '../../components/errorMessage/errorMessage';
import modals from '../../stores/Modals';
import { Wallet } from '../../stores/models/Wallet';

export interface SwitchModalProps {
	type: 'account' | 'network';
	wallet: Wallet;
	needAccount?: IGenericAccount;
	needNetwork?: string;
	onConfirm: (result: boolean) => void;
}

@observer
export default class SwitchModal extends PureComponent<SwitchModalProps> {
	static async show(
		type: 'account' | 'network',
		wallet: Wallet,
		needAccount?: IGenericAccount,
		needNetwork?: string,
	): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			modals.show((close: () => void) => (
				<SwitchModal
					type={type}
					wallet={wallet}
					needAccount={needAccount}
					needNetwork={needNetwork}
					onConfirm={result => {
						close();
						resolve(result);
					}}
				/>
			));
		});
	}

	// static async view(
	// 	type: 'account' | 'network',
	// 	wallet: Wallet,
	// 	needAccount?: IGenericAccount,
	// 	needNetwork?: string,
	// ) {
	// 	let hide = () => {};
	// 	const promise = new Promise<boolean>((resolve, reject) => {
	// 		modals.show((close: () => void) => (
	// 			<SwitchModal
	// 				type={type}
	// 				wallet={wallet}
	// 				needAccount={needAccount}
	// 				needNetwork={needNetwork}
	// 				onConfirm={result => {
	// 					close();
	// 					resolve(result);
	// 				}}
	// 			/>
	// 		));
	// 	});
	// 	return { promise, hide };
	// }

	@observable error: string = '';

	constructor(props: SwitchModalProps) {
		super(props);

		makeObservable(this);
	}

	async requestSwitch() {
		if (this.props.wallet.controller.isMultipleAccountsSupported()) {
			await this.props.wallet.controller.requestAuthentication();
		} else {
			const acc = await this.props.wallet.getCurrentAccount();
			if (acc) {
				await this.props.wallet.controller.disconnectAccount(acc);
			}
			await this.props.wallet.controller.requestAuthentication();
		}
	}

	@autobind
	handleAccountUpdate(account: IGenericAccount | null) {
		if (this.props.needAccount !== undefined) {
			if (!account) {
				// this.requestSwitch();
				// this.error = `You've logged out instead of selecting account. Please, try again`;
			} else if (account.address !== this.props.needAccount.address) {
				this.requestSwitch();
				this.error = `You've selected wrong account. Please, try again`;
			} else {
				this.props.onConfirm(true);
			}
		} else {
			if (account !== null) {
				this.props.onConfirm(true);
			} else {
				// this.requestSwitch();
				// this.error = `You've logged out instead of selecting account. Please, try again`;
			}
		}
	}

	@autobind
	handleNetworkUpdate(network: string) {
		if (this.props.needNetwork !== undefined) {
			if (network !== this.props.needNetwork) {
				this.requestSwitch();
				this.error = `You've selected wrong network. Please, try again`;
			} else {
				this.props.onConfirm(true);
			}
		} else {
			this.props.onConfirm(true);
		}
	}

	componentWillUnmount(): void {
		if (this.props.type === 'account') {
			this.props.wallet.off('accountUpdate', this.handleAccountUpdate);
		} else {
			this.props.wallet.off('networkUpdate', this.handleNetworkUpdate);
		}
	}

	componentDidMount(): void {
		if (this.props.type === 'account') {
			this.props.wallet.on('accountUpdate', this.handleAccountUpdate);
		} else {
			this.props.wallet.on('chainUpdate', this.handleNetworkUpdate);
		}
		this.requestSwitch();
	}

	render() {
		const wallet = this.props.wallet;
		if (wallet.wallet === 'everwallet') {
			return null;
		}

		return (
			<Modal
				cancelText="Cancel"
				visible={true}
				closable={false}
				okButtonProps={{ style: { display: 'none' } }}
				title="Switch account"
				onCancel={() => this.props.onConfirm(false)}
			>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
					<p>Please unlock you wallet and make sure that both account and network are selected correctly.</p>

					{this.props.needAccount && <p>Account: {this.props.needAccount.address}</p>}
					{this.props.needNetwork && <p>Network: {this.props.needNetwork}</p>}

					{this.error && <ErrorMessage>{this.error}</ErrorMessage>}

					<br />
					<video src={metamaskSwitchVideo} autoPlay loop style={{ maxWidth: 300 }} />
				</div>
			</Modal>
		);
	}
}
