import { IGenericAccount } from '@ylide/sdk';
import { autobind } from 'core-decorators';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import metamaskSwitchVideo from '../../assets/video/metamask-switch.mp4';
import { Wallet } from '../../stores/models/Wallet';
import { requestSwitchAccount } from '../../utils/account';
import { truncateInMiddle } from '../../utils/string';
import { ErrorMessage } from '../errorMessage/errorMessage';
import { Modal } from '../modal/modal';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';

interface SwitchModalProps {
	type: 'account' | 'network';
	wallet: Wallet;
	needAccount?: IGenericAccount;
	needNetwork?: string;
	onConfirm: (result: boolean) => void;
}

@observer
export class SwitchModal extends PureComponent<SwitchModalProps> {
	@observable error: string = '';

	constructor(props: SwitchModalProps) {
		super(props);

		makeObservable(this);
	}

	@autobind
	handleAccountUpdate(account: IGenericAccount | null) {
		if (this.props.needAccount !== undefined) {
			if (!account) {
				// this.requestSwitch();
				// this.error = `You've logged out instead of selecting account. Please, try again`;
			} else if (account.address !== this.props.needAccount.address) {
				requestSwitchAccount(this.props.wallet);
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
				requestSwitchAccount(this.props.wallet);
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
		requestSwitchAccount(this.props.wallet);
	}

	render() {
		const wallet = this.props.wallet;
		if (wallet.wallet === 'everwallet') {
			return null;
		}

		return (
			<Modal onClose={() => this.props.onConfirm(false)}>
				<div
					style={{
						display: 'grid',
						justifyItems: 'center',
						gridGap: 16,
						padding: 32,
						width: '100%',
					}}
				>
					<div style={{ fontSize: 20 }}>Activate account</div>

					<div>
						Please unlock you wallet and make sure that both account and network are selected correctly.
					</div>

					{this.props.needAccount && (
						<div>Account: {truncateInMiddle(this.props.needAccount.address, 16, '..')}</div>
					)}
					{this.props.needNetwork && <div>Network: {this.props.needNetwork}</div>}

					{this.error && <ErrorMessage>{this.error}</ErrorMessage>}

					<video src={metamaskSwitchVideo} autoPlay loop style={{ width: 300, maxWidth: '100%' }} />
				</div>
			</Modal>
		);
	}
}

export namespace SwitchModal {
	export function show(
		type: 'account' | 'network',
		wallet: Wallet,
		needAccount?: IGenericAccount,
		needNetwork?: string,
	) {
		return showStaticComponent<boolean>(resolve => (
			<SwitchModal
				type={type}
				wallet={wallet}
				needAccount={needAccount}
				needNetwork={needNetwork}
				onConfirm={resolve}
			/>
		));
	}
}
