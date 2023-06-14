import { IGenericAccount } from '@ylide/sdk';
import { autobind } from 'core-decorators';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import { Wallet } from '../../stores/models/Wallet';
import { requestSwitchAccount } from '../../utils/account';
import { ActionModal } from '../actionModal/actionModal';
import { BlockChainLabel } from '../BlockChainLabel/BlockChainLabel';
import { GridRowBox } from '../boxes/boxes';
import { ErrorMessage } from '../errorMessage/errorMessage';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import { WalletTag } from '../walletTag/walletTag';

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
				this.error = 'Wrong account 😒 Please try again.';
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
				this.error = 'Wrong network 😒 Please try again.';
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
		const { wallet, needAccount, needNetwork } = this.props;

		if (wallet.wallet === 'everwallet') {
			return null;
		}

		return (
			<ActionModal title="Activate account" onClose={() => this.props.onConfirm(false)}>
				{needAccount && <WalletTag wallet={wallet.wallet} address={needAccount.address} />}

				{needNetwork && (
					<GridRowBox>
						Network
						<BlockChainLabel blockchain={needNetwork} />
					</GridRowBox>
				)}

				{this.error && <ErrorMessage>{this.error}</ErrorMessage>}

				<div>Please unlock you wallet and make sure that both account and network are selected correctly.</div>
			</ActionModal>
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
