import { PureComponent } from 'react';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';

import modals from '../../stores/Modals';
import { blockchainsMap, calloutSvg, evmNameToNetwork } from '../../constants';
import domain from '../../stores/Domain';
import { CrossIcon } from '../../icons/CrossIcon';
import { YlideButton } from '../../controls/YlideButton';
import { asyncDelay, ExternalYlidePublicKey, IGenericAccount } from '@ylide/sdk';
import { Wallet } from '../../stores/models/Wallet';
import { WalletTag } from '../../controls/WalletTag';
import { EVMNetwork } from '@ylide/ethereum';
import cn from 'classnames';
import { Loader } from '../../controls/Loader';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { isBytesEqual } from '../../utils/isBytesEqual';
import { useNavigate } from 'react-router-dom';

const txPrices: Record<EVMNetwork, number> = {
	[EVMNetwork.LOCAL_HARDHAT]: 0.001,
	[EVMNetwork.ETHEREUM]: 0.001,
	[EVMNetwork.BNBCHAIN]: 0.001,
	[EVMNetwork.POLYGON]: 0.001,
	[EVMNetwork.ARBITRUM]: 0.001,
	[EVMNetwork.OPTIMISM]: 0.001,
	[EVMNetwork.AVALANCHE]: 0.001,
	[EVMNetwork.FANTOM]: 0.001,
	[EVMNetwork.KLAYTN]: 0.001,
	[EVMNetwork.GNOSIS]: 0.001,
	[EVMNetwork.AURORA]: 0.001,
	[EVMNetwork.CELO]: 0.001,
	[EVMNetwork.CRONOS]: 0.001,
	[EVMNetwork.MOONBEAM]: 0.001,
	[EVMNetwork.MOONRIVER]: 0.001,
	[EVMNetwork.METIS]: 0.001,
	[EVMNetwork.ASTAR]: 0.001,
};

export interface NewPasswordModalProps {
	wallet: Wallet;
	account: IGenericAccount;
	remoteKeys: Record<string, ExternalYlidePublicKey | null>;
	onResolve: (value: null | string, remember: boolean, forceNew: boolean) => void;
}

@observer
export default class NewPasswordModal extends PureComponent<NewPasswordModalProps> {
	static async show(
		wallet: Wallet,
		account: IGenericAccount,
		remoteKeys: Record<string, ExternalYlidePublicKey | null>,
	): Promise<{} | null> {
		return new Promise<{ password: string; remember: boolean; forceNew: boolean } | null>((resolve, reject) => {
			modals.show((close: () => void) => (
				<NewPasswordModal
					wallet={wallet}
					account={account}
					remoteKeys={remoteKeys}
					onResolve={(value: null | string, remember: boolean, forceNew: boolean) => {
						close();
						if (value === null) {
							resolve(null);
						} else {
							resolve({ password: value, remember, forceNew });
						}
					}}
				/>
			));
		});
	}

	constructor(props: NewPasswordModalProps) {
		super(props);

		makeObservable(this);
	}

	@observable evmBalances: Record<EVMNetwork, number> = {
		[EVMNetwork.LOCAL_HARDHAT]: 0,
		[EVMNetwork.ETHEREUM]: 0,
		[EVMNetwork.BNBCHAIN]: 0,
		[EVMNetwork.POLYGON]: 0,
		[EVMNetwork.ARBITRUM]: 0,
		[EVMNetwork.OPTIMISM]: 0,
		[EVMNetwork.AVALANCHE]: 0,
		[EVMNetwork.FANTOM]: 0,
		[EVMNetwork.KLAYTN]: 0,
		[EVMNetwork.GNOSIS]: 0,
		[EVMNetwork.AURORA]: 0,
		[EVMNetwork.CELO]: 0,
		[EVMNetwork.CRONOS]: 0,
		[EVMNetwork.MOONBEAM]: 0,
		[EVMNetwork.MOONRIVER]: 0,
		[EVMNetwork.METIS]: 0,
		[EVMNetwork.ASTAR]: 0,
	};

	async componentDidMount() {
		if (this.props.wallet.factory.blockchainGroup === 'evm') {
			const blockchainName = await this.props.wallet.controller.getCurrentBlockchain();
			this.network = evmNameToNetwork(blockchainName);
			const balances = await this.props.wallet.getBalancesOf(this.props.account.address);
			for (const bcName of Object.keys(balances)) {
				const network = evmNameToNetwork(bcName);
				if (network) {
					this.evmBalances[network] = balances[bcName].number;
				}
			}
		}
	}

	@observable network?: EVMNetwork;
	@observable loading = false;
	@observable freshestKey =
		Object.keys(this.props.remoteKeys)
			.filter(t => !!this.props.remoteKeys[t])
			.map(t => ({
				key: this.props.remoteKeys[t]!,
				blockchain: t,
			}))
			.sort((a, b) => b.key.timestamp - a.key.timestamp)
			.find(t => true) || null;

	async publishLocalKey(account: DomainAccount) {
		this.step = 2;
		try {
			await account.attachRemoteKey();
			await asyncDelay(7000);
			await account.init();
		} catch (err) {
			alert('Transaction was not published. Please, try again');
		} finally {
			this.step = 4;
		}
	}

	@observable forceNew = false;

	async createLocalKey() {
		this.step = 1;
		let tempLocalKey;
		try {
			tempLocalKey = await this.props.wallet.constructLocalKey(this.props.account, this.password);
		} catch (err) {
			console.log('asd: ', err);
			this.step = 0;
			return;
		}
		if (!this.freshestKey) {
			const domainAccount = await this.props.wallet.instantiateNewAccount(this.props.account, tempLocalKey);
			return await this.publishLocalKey(domainAccount);
		} else if (isBytesEqual(this.freshestKey.key.publicKey.bytes, tempLocalKey.publicKey)) {
			await this.props.wallet.instantiateNewAccount(this.props.account, tempLocalKey);
			this.step = 5;
		} else if (this.forceNew) {
			const domainAccount = await this.props.wallet.instantiateNewAccount(this.props.account, tempLocalKey);
			return await this.publishLocalKey(domainAccount);
		} else {
			alert('Ylide password was wrong, please, try again');
			return;
		}
	}

	async networkSelect(network: EVMNetwork) {
		this.network = network;
		this.step = 3;
	}

	@observable password: string = '';
	@observable passwordRepeat: string = '';
	@observable remember = false;
	@observable forgotMode = 0;
	@observable step = 0;

	render() {
		return (
			<div className="modal-wrap">
				<div
					className="modal-backdrop"
					onClick={() => {
						this.props.onResolve(null, false, false);
					}}
				/>
				<div className="modal-content wallet-modal account-modal">
					<div
						className="cross-button"
						onClick={() => {
							this.props.onResolve(null, false, false);
						}}
					>
						<CrossIcon size={12} />
					</div>
					<div
						style={{
							padding: 24,
							paddingTop: 12,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<WalletTag wallet="metamask" address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
					</div>
					{this.step === 0 ? (
						<>
							<h3 className="wm-title">{this.freshestKey ? `Enter password` : `Create password`}</h3>
							<h4 className="wm-subtitle">
								{this.freshestKey ? (
									<>
										We found your key in the {blockchainsMap[this.freshestKey.blockchain].logo(12)}{' '}
										<b>{blockchainsMap[this.freshestKey.blockchain].title}</b> blockchain. Please,
										enter your Ylide Password to access it.
									</>
								) : (
									`This password will be used to encrypt and decrypt your mails.`
								)}
							</h4>
							{!this.freshestKey ? (
								<div className="wm-body">
									<form
										name="sign-up"
										style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'stretch',
											justifyContent: 'flex-start',
										}}
										action="/"
										method="POST"
										noValidate
									>
										<input
											className="ylide-input ylide-password-input"
											type="password"
											autoComplete="new-password"
											name="password"
											id="password"
											placeholder="Enter Ylide password"
											value={this.password}
											onChange={e => (this.password = e.target.value)}
										/>
										<input
											className="ylide-input ylide-password-input"
											type="password"
											autoComplete="new-password"
											name="repeat-password"
											id="repeat-password"
											placeholder="Repeat your password"
											value={this.passwordRepeat}
											onChange={e => (this.passwordRepeat = e.target.value)}
										/>
									</form>
									<div className="ylide-callout">{calloutSvg}</div>
								</div>
							) : (
								<div className="wm-body centered">
									<input
										style={{
											fontFamily: 'Lexend',
											fontSize: 16,
											borderRadius: 40,
											textAlign: 'center',
											height: 36,
											border: '1px solid #000000',
											padding: '5px 10px',
											marginLeft: 20,
											marginRight: 20,
											marginTop: 20,
											marginBottom: 20,
										}}
										value={this.password}
										onChange={e => (this.password = e.target.value)}
										type="password"
										placeholder="Enter your Ylide password"
									/>
									{/* <div style={{ textAlign: 'center' }}>
										<a
											href="#forgot"
											style={{
												fontFamily: 'Lexend',
												fontStyle: 'normal',
												fontWeight: '400',
												fontSize: '14px',
												lineHeight: '130%',
												color: '#000000',
											}}
											onClick={() => {
												this.forgotMode = 1;
											}}
										>
											Forgot password?
										</a>
									</div> */}
								</div>
							)}
							<div className="wm-footer">
								<YlideButton ghost style={{ width: 128 }}>
									Back
								</YlideButton>
								<YlideButton
									primary
									style={{ width: 216 }}
									onClick={() => {
										this.createLocalKey();
									}}
								>
									Continue
								</YlideButton>
							</div>
						</>
					) : this.step === 1 ? (
						<>
							<div className="wm-body centered">
								<div
									style={{
										display: 'flex',
										flexDirection: 'row',
										alignItems: 'flex-start',
										justifyContent: 'flex-end',
										paddingRight: 24,
										paddingBottom: 20,
									}}
								>
									<svg
										width="164"
										height="104"
										viewBox="0 0 164 104"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M2 102.498C2 61.4999 69.5 15.4999 162 10.4785M162 10.4785L133.5 1.50183M162 10.4785L141.562 31.6153"
											stroke="url(#paint0_linear_54_5088)"
											stroke-width="3"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<defs>
											<linearGradient
												id="paint0_linear_54_5088"
												x1="82"
												y1="1.50183"
												x2="82"
												y2="102.498"
												gradientUnits="userSpaceOnUse"
											>
												<stop stop-color="#97A1FF" />
												<stop offset="1" stop-color="#FFB571" />
											</linearGradient>
										</defs>
									</svg>
								</div>
								<h3 className="wm-title">Confirm the message</h3>
								<h4 className="wm-subtitle">
									We need you to sign your password so we can generate you an unique communication key
								</h4>
							</div>
							<div className="wm-footer" style={{ justifyContent: 'center' }}>
								<YlideButton ghost style={{ width: 128 }}>
									Back
								</YlideButton>
							</div>
						</>
					) : this.step === 2 ? (
						<>
							<h3 className="wm-title">Choose network</h3>
							<div
								className="wm-body"
								style={{
									marginTop: -24,
									paddingTop: 24,
									marginLeft: -24,
									marginRight: -24,
									paddingLeft: 24,
									paddingRight: 24,
									overflow: 'scroll',
									maxHeight: 390,
								}}
							>
								{domain.registeredBlockchains
									.filter(f => f.blockchainGroup === 'evm')
									.sort((a, b) => {
										const aBalance = Number(
											this.evmBalances[evmNameToNetwork(a.blockchain)!].toFixed(4),
										);
										const bBalance = Number(
											this.evmBalances[evmNameToNetwork(b.blockchain)!].toFixed(4),
										);
										const aTx = txPrices[evmNameToNetwork(a.blockchain)!];
										const bTx = txPrices[evmNameToNetwork(b.blockchain)!];
										if (aBalance === bBalance) {
											return aTx - bTx;
										} else {
											return bBalance - aBalance;
										}
									})
									.map((bc, idx) => {
										const bData = blockchainsMap[bc.blockchain];
										return (
											<div
												className={cn('wmn-plate', {
													disabled:
														Number(
															this.evmBalances[evmNameToNetwork(bc.blockchain)!].toFixed(
																4,
															),
														) === 0,
												})}
												onClick={() => this.networkSelect(evmNameToNetwork(bc.blockchain)!)}
											>
												<div className="wmn-icon">{bData.logo(32)}</div>
												<div className="wmn-title">
													<div className="wmn-blockchain">{bData.title}</div>
													{Number(
														this.evmBalances[evmNameToNetwork(bc.blockchain)!].toFixed(4),
													) > 0 && idx === 0 ? (
														<div className="wmn-optimal">Optimal</div>
													) : null}
												</div>
												<div className="wmn-balance">
													<div className="wmn-wallet-balance">
														{Number(
															this.evmBalances[evmNameToNetwork(bc.blockchain)!].toFixed(
																4,
															),
														)}{' '}
														{bData.ethNetwork?.nativeCurrency.symbol || 'ETH'}
													</div>
													<div className="wmn-transaction-price">
														Transaction = 0.0004{' '}
														{bData.ethNetwork?.nativeCurrency.symbol || 'ETH'}
													</div>
												</div>
											</div>
										);
									})}
							</div>
						</>
					) : this.step === 3 ? (
						<>
							<div className="wm-body centered">
								<div
									style={{
										display: 'flex',
										flexDirection: 'row',
										alignItems: 'flex-start',
										justifyContent: 'flex-end',
										paddingRight: 24,
										paddingBottom: 20,
									}}
								>
									<svg
										width="164"
										height="104"
										viewBox="0 0 164 104"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M2 102.498C2 61.4999 69.5 15.4999 162 10.4785M162 10.4785L133.5 1.50183M162 10.4785L141.562 31.6153"
											stroke="url(#paint0_linear_54_5088)"
											stroke-width="3"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<defs>
											<linearGradient
												id="paint0_linear_54_5088"
												x1="82"
												y1="1.50183"
												x2="82"
												y2="102.498"
												gradientUnits="userSpaceOnUse"
											>
												<stop stop-color="#97A1FF" />
												<stop offset="1" stop-color="#FFB571" />
											</linearGradient>
										</defs>
									</svg>
								</div>
								<h3 className="wm-title">Confirm the transaction</h3>
								<h4 className="wm-subtitle">
									Please sign the transaction in your wallet to publish your unique communication key
								</h4>
							</div>
							<div className="wm-footer" style={{ justifyContent: 'center' }}>
								<YlideButton ghost style={{ width: 128 }}>
									Back
								</YlideButton>
							</div>
						</>
					) : this.step === 4 ? (
						<>
							<div className="wm-body centered">
								<div
									style={{
										display: 'flex',
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center',
										paddingBottom: 40,
									}}
								>
									<Loader />
								</div>
								<h3 className="wm-title">Publishing the key</h3>
								<h4 className="wm-subtitle">Please, wait for the transaction to be completed</h4>
							</div>
						</>
					) : this.step === 5 ? (
						<>
							<h3 className="wm-title" style={{ marginBottom: 10 }}>
								Your account is ready
							</h3>
							<div className="wm-body">
								<img
									src={require('../../assets/img/success.png')}
									alt="Success"
									style={{ marginLeft: -24, marginRight: -24, marginBottom: 14 }}
								/>
							</div>
							<PasswordModalFooter
								close={() => {
									this.props.onResolve('', false, false);
								}}
							/>
						</>
					) : null}
				</div>
			</div>
		);
	}
}

function PasswordModalFooter({ close }: { close: () => void }) {
	const nav = useNavigate();

	return (
		<div className="wm-footer-vertical">
			<YlideButton
				primary
				onClick={() => {
					nav('/feed/main');
					close();
				}}
			>
				Go to inbox
			</YlideButton>
			<YlideButton nice onClick={close}>
				Add one more account
			</YlideButton>
		</div>
	);
}
