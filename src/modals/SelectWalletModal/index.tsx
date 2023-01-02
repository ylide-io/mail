import * as browserUtils from '@walletconnect/browser-utils';
import clsx from 'clsx';
import { autobind } from 'core-decorators';
import { computed, makeObservable, observable, reaction, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';
import QRCode from 'react-qr-code';

import { supportedWallets, walletsMap } from '../../constants';
import { Loader } from '../../controls/Loader';
import { YlideButton } from '../../controls/YlideButton';
import { CrossIcon } from '../../icons/CrossIcon';
import domain from '../../stores/Domain';
import modals from '../../stores/Modals';
import { Wallet } from '../../stores/models/Wallet';
import walletConnect from '../../stores/WalletConnect';
import NewPasswordModal from '../NewPasswordModal';
import SwitchModal from '../SwitchModal';

export interface SelectWalletModalProps {
	onResolve: () => void;
}

@observer
export default class SelectWalletModal extends PureComponent<SelectWalletModalProps> {
	static async show(): Promise<{} | null> {
		return new Promise<{} | null>((resolve, reject) => {
			modals.show((close: () => void) => (
				<SelectWalletModal
					onResolve={() => {
						close();
						resolve(null);
					}}
				/>
			));
		});
	}

	constructor(props: SelectWalletModalProps) {
		super(props);

		makeObservable(this);
	}

	@autobind
	async disconnectWalletConnect() {
		if (domain.walletConnectState.loading || !domain.walletConnectState.connected) {
			return;
		}

		console.log('domain.walletControllers: ', toJS(domain.walletControllers));
		console.log('domain.walletControllers.evm: ', toJS(domain.walletControllers.evm));
		console.log('domain.walletControllers.evm.walletconnect: ', toJS(domain.walletControllers.evm.walletconnect));
		await (domain.walletControllers.evm.walletconnect as any)?.writeWeb3.currentProvider.disconnect();
		// TODO: pizdec
		document.location.reload();
	}

	walletConnectWas = domain.walletConnectState.loading ? false : domain.walletConnectState.connected;

	async componentDidMount() {
		reaction(
			() => toJS(domain.walletConnectState),
			val => {
				console.log('mmasdmasdm:', val);
			},
		);
		console.log('akakasdkkds:', toJS(domain.walletConnectState));
		reaction(
			() => domain.wallets && domain.wallets.find(w => w.factory.wallet === 'walletconnect'),
			(wc, prev) => {
				if (!prev && wc) {
					// wallet connect connected
					console.log('all is good');
					this.wallet = 'walletconnect';
					this.connectAccount();
				}
			},
		);
	}

	@observable loading = false;

	// async publishLocalKey(account: DomainAccount) {
	// 	let publishCtrl = PublishKeyModal.view(account.wallet, false);
	// 	try {
	// 		await account.attachRemoteKey();
	// 		publishCtrl.hide();
	// 		publishCtrl = PublishKeyModal.view(account.wallet, true);
	// 		await asyncDelay(7000);
	// 		await account.init();
	// 	} catch (err) {
	// 		alert('Transaction was not published. Please, try again');
	// 	} finally {
	// 		publishCtrl.hide();
	// 	}
	// }

	// async createLocalKey(wallet: Wallet, account: IGenericAccount) {
	// 	const result = await PasswordModal.show('to activate new account');
	// 	if (!result) {
	// 		return;
	// 	}
	// 	let tempLocalKey;
	// 	const signatureCtrl = SignatureModal.view(wallet);
	// 	try {
	// 		tempLocalKey = await wallet.constructLocalKey(account, result.value);
	// 	} finally {
	// 		signatureCtrl.hide();
	// 	}
	// 	let remoteKey;
	// 	try {
	// 		const { remoteKey: remoteKeyInst } = await wallet.readRemoteKeys(account);
	// 		remoteKey = remoteKeyInst;
	// 	} catch (err) {
	// 		alert('Retrieving blockchain keys failed, please, try again');
	// 	}
	// 	if (!remoteKey) {
	// 		const domainAccount = await wallet.instantiateNewAccount(account, tempLocalKey);
	// 		return await this.publishLocalKey(domainAccount);
	// 	} else if (isBytesEqual(remoteKey.publicKey.bytes, tempLocalKey.publicKey)) {
	// 		return await wallet.instantiateNewAccount(account, tempLocalKey);
	// 	} else if (result.forceNew) {
	// 		const domainAccount = await wallet.instantiateNewAccount(account, tempLocalKey);
	// 		return await this.publishLocalKey(domainAccount);
	// 	} else {
	// 		alert('Ylide password was wrong, please, try again');
	// 		return;
	// 	}
	// }

	async connectWalletAccount(wallet: Wallet) {
		let currentAccount = await wallet.getCurrentAccount();
		// to fix everwallet stuck in auth state without registered key
		if (
			currentAccount &&
			!wallet.isAccountRegistered(currentAccount) &&
			!wallet.controller.isMultipleAccountsSupported()
		) {
			await wallet.controller.disconnectAccount(currentAccount);
		}
		currentAccount = await wallet.getCurrentAccount();
		if (currentAccount && wallet.isAccountRegistered(currentAccount)) {
			const result = await SwitchModal.show('account', wallet);
			if (!result) {
				return null;
			}
		}
		currentAccount = await wallet.getCurrentAccount();
		if (currentAccount && wallet.isAccountRegistered(currentAccount)) {
			alert('This account is already registered. Please, chose a different one');
			return null;
		} else {
			return await wallet.connectAccount();
		}
	}

	@observable wallet = '';

	@autobind
	async connectAccount() {
		const wallet = domain.wallets.find(w => w.factory.wallet === this.wallet)!;

		this.loading = true;
		try {
			const account = await this.connectWalletAccount(wallet);
			if (!account) {
				return;
			}
			const remoteKeys = await wallet.readRemoteKeys(account);
			this.props.onResolve();
			await NewPasswordModal.show(
				true, // document.location.search === '?faucet=1',
				wallet,
				account,
				remoteKeys.remoteKeys,
			);
		} finally {
			this.loading = false;
		}
	}

	@observable copy = false;
	@observable title: string = '';
	@observable activeTab: 'qr' | 'desktop' | 'install' =
		!domain.walletConnectState.loading && domain.walletConnectState.connected ? 'install' : 'qr';
	@observable search = '';

	@computed get availableBrowserWallets() {
		return supportedWallets
			.map(w => w.wallet)
			.filter(w => {
				return w !== 'walletconnect' && !!domain.availableWallets.find(ww => ww.wallet === w);
			});
	}

	@computed get walletsToInstall() {
		return supportedWallets
			.map(w => w.wallet)
			.filter(w => {
				return w !== 'walletconnect' && !domain.availableWallets.find(ww => ww.wallet === w);
			});
	}
	// supportedWallets

	render() {
		// const isAndroid = browserUtils.isAndroid();
		// const isIOS = !isAndroid;
		const isMobile = browserUtils.isMobile();
		const isDesktop = !isMobile;

		const platform = isMobile ? 'mobile' : 'desktop';
		const links = browserUtils.getMobileLinkRegistry(
			browserUtils.formatMobileRegistry(walletConnect.registry, platform),
		);
		// var href = browserUtils.formatIOSMobile(props.uri, entry);
		return (
			<div className="modal-wrap">
				<div
					className="modal-backdrop"
					onClick={() => {
						this.props.onResolve();
					}}
				/>
				<div className="modal-content wallet-modal">
					<div
						className="cross-button"
						onClick={() => {
							this.props.onResolve();
						}}
					>
						<CrossIcon size={12} />
					</div>
					<h3 className="wm-title">Select wallet</h3>
					{this.availableBrowserWallets.length ? (
						<div className="available-wallets">
							<div className="aw-title">Available browser extensions</div>
							<div className="wallets-container">
								{this.availableBrowserWallets.map(w => {
									const wData = walletsMap[w];
									return (
										<div
											className="wallet-icon"
											key={w}
											onClick={async () => {
												this.wallet = w;
												await this.connectAccount();
											}}
										>
											<div className="wallet-icon-block">
												<div className="wallet-icon-image">{wData.logo(32)}</div>
											</div>
											<div className="wallet-icon-title">{wData.title}</div>
										</div>
									);
								})}
							</div>
						</div>
					) : null}
					<div className="wm-tabs">
						{isDesktop ? (
							<>
								<div
									onClick={() => {
										this.activeTab = 'qr';
										this.search = '';
									}}
									className={clsx('wm-tab', { active: this.activeTab === 'qr' })}
								>
									QR code
								</div>
								<div
									onClick={() => {
										this.activeTab = 'desktop';
										this.search = '';
									}}
									className={clsx('wm-tab', { active: this.activeTab === 'desktop' })}
								>
									Desktop
								</div>
								<div
									onClick={() => {
										this.activeTab = 'install';
										this.search = '';
									}}
									className={clsx('wm-tab', { active: this.activeTab === 'install' })}
								>
									Install
								</div>
							</>
						) : (
							<>
								<div
									onClick={() => {
										this.activeTab = 'qr';
										this.search = '';
									}}
									className={clsx('wm-tab', { active: this.activeTab === 'qr' })}
								>
									Mobile
								</div>
							</>
						)}
					</div>
					<div className="wm-tab-content">
						{this.activeTab === 'qr' ? (
							isDesktop ? (
								<>
									<div className="qr-content" style={{ position: 'relative' }}>
										{!domain.walletConnectState.loading && domain.walletConnectState.connected ? (
											<div className="overall">
												WalletConnect can be used to connect only one account.
												<br />
												<br />
												Please, use native browser extensions to connect more wallets or
												disconnect current WalletConnect connection.
												<br />
												<br />
												<YlideButton onClick={this.disconnectWalletConnect}>
													Disconnect WalletConnect ({domain.walletConnectState.walletName})
												</YlideButton>
											</div>
										) : null}

										<div className="svg-background">
											<svg
												className="left-top"
												width="34"
												height="34"
												viewBox="0 0 34 34"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													fillRule="evenodd"
													clipRule="evenodd"
													d="M0 8C0 3.58172 3.58172 0 8 0H33.1875C33.4982 0 33.75 0.25184 33.75 0.5625V0.5625C33.75 0.87316 33.4982 1.125 33.1875 1.125H8.125C4.25901 1.125 1.125 4.25901 1.125 8.125V33.1875C1.125 33.4982 0.87316 33.75 0.5625 33.75V33.75C0.25184 33.75 0 33.4982 0 33.1875V8Z"
													fill="#CFCFDF"
												/>
											</svg>
											<svg
												className="left-bottom"
												width="34"
												height="34"
												viewBox="0 0 34 34"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													fillRule="evenodd"
													clipRule="evenodd"
													d="M7.99976 34C3.58148 34 -0.000244141 30.4183 -0.000244141 26L-0.000244141 0.812637C-0.000244141 0.501901 0.251657 0.25 0.562393 0.25V0.25C0.873129 0.25 1.12503 0.501901 1.12503 0.812637L1.12503 25.875C1.12503 29.741 4.25904 32.875 8.12503 32.875L33.1876 32.875C33.4983 32.875 33.7501 33.1268 33.7501 33.4375V33.4375C33.7501 33.7482 33.4983 34 33.1876 34L7.99976 34Z"
													fill="#CFCFDF"
												/>
											</svg>
											<svg
												className="right-top"
												width="34"
												height="34"
												viewBox="0 0 34 34"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													fillRule="evenodd"
													clipRule="evenodd"
													d="M25.9988 6.10352e-05C30.4171 6.10352e-05 33.9988 3.58178 33.9988 8.00006L33.9988 33.1881C33.9988 33.4985 33.7472 33.7501 33.4368 33.7501V33.7501C33.1265 33.7501 32.8749 33.4985 32.8749 33.1881L32.8749 8.12499C32.8749 4.259 29.7409 1.12499 25.8749 1.12499L0.812275 1.12499C0.501634 1.12499 0.249809 0.873168 0.249809 0.562527V0.562527C0.249809 0.251886 0.501632 6.10352e-05 0.812273 6.10352e-05L25.9988 6.10352e-05Z"
													fill="#CFCFDF"
												/>
											</svg>
											<svg
												className="right-bottom"
												width="34"
												height="34"
												viewBox="0 0 34 34"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													fillRule="evenodd"
													clipRule="evenodd"
													d="M0.812552 34C0.501893 34 0.250053 33.7482 0.250053 33.4375V33.4375C0.250053 33.1268 0.501889 32.875 0.812548 32.875L25.8751 32.875C29.7411 32.875 32.8751 29.741 32.8751 25.875L32.8751 0.811895C32.8751 0.501538 33.1267 0.249944 33.4371 0.249944V0.249944C33.7474 0.249944 33.999 0.501538 33.999 0.811895L33.999 26C33.999 30.4182 30.4173 34 25.999 34L0.812552 34Z"
													fill="#CFCFDF"
												/>
											</svg>
											<QRCode
												value={
													!domain.walletConnectState.loading &&
													!domain.walletConnectState.connected
														? domain.walletConnectState.url
														: ''
												}
											/>
										</div>
										<div className="qr-text">
											Scan QR code with
											<br />a Wallet Connect compatible wallet
										</div>
										<a
											href="#copy-link"
											onClick={() => {
												navigator.clipboard.writeText(
													!domain.walletConnectState.loading &&
														!domain.walletConnectState.connected
														? domain.walletConnectState.url
														: '',
												);
												this.copy = true;
												setTimeout(() => (this.copy = false), 1000);
											}}
											className="qr-link"
										>
											{this.copy ? 'Copied' : 'Copy to clipboard'}
										</a>
									</div>
								</>
							) : (
								<>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'stretch',
											position: 'relative',
										}}
									>
										{!domain.walletConnectState.loading && domain.walletConnectState.connected ? (
											<div className="overall">
												WalletConnect can be used to connect only one account.
												<br />
												<br />
												Please, use native browser extensions to connect more wallets or
												disconnect current WalletConnect connection.
												<br />
												<br />
												<YlideButton onClick={this.disconnectWalletConnect}>
													Disconnect WalletConnect ({domain.walletConnectState.walletName})
												</YlideButton>
											</div>
										) : null}
										<input
											className="wallets-search"
											value={this.search}
											onChange={e => (this.search = e.target.value)}
											placeholder="Search"
											type="text"
										/>
										<div className="wallets-list">
											{walletConnect.loading ? (
												<>
													<Loader />
												</>
											) : (
												links
													.filter(d =>
														d.name.toLowerCase().includes(this.search.toLowerCase()),
													)
													.map(w => {
														return (
															<div
																className="wallet-icon"
																onClick={() => {
																	const href = browserUtils.formatIOSMobile(
																		!domain.walletConnectState.loading &&
																			!domain.walletConnectState.connected
																			? domain.walletConnectState.url
																			: '',
																		w,
																	);
																	console.log('opening href: ', href);
																	browserUtils.saveMobileLinkInfo({
																		name: w.name,
																		href: href,
																	});
																	window.open(href, '_blank');
																}}
															>
																<div className="wallet-icon-block">
																	<div className="wallet-icon-image">
																		<img
																			src={w.logo}
																			alt="Wallet Logo"
																			style={{
																				width: 32,
																				height: 32,
																				borderRadius: 6,
																			}}
																		/>
																	</div>
																</div>
																<div className="wallet-icon-title">{w.shortName}</div>
															</div>
														);
													})
											)}
										</div>
									</div>
								</>
							)
						) : this.activeTab === 'desktop' ? (
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'stretch',
									position: 'relative',
								}}
							>
								{!domain.walletConnectState.loading && domain.walletConnectState.connected ? (
									<div className="overall">
										WalletConnect can be used to connect only one account.
										<br />
										<br />
										Please, use native browser extensions to connect more wallets or disconnect
										current WalletConnect connection.
										<br />
										<br />
										<YlideButton onClick={this.disconnectWalletConnect}>
											Disconnect WalletConnect ({domain.walletConnectState.walletName})
										</YlideButton>
									</div>
								) : null}
								<input
									className="wallets-search"
									value={this.search}
									onChange={e => (this.search = e.target.value)}
									placeholder="Search"
									type="text"
								/>
								<div className="wallets-list">
									{walletConnect.loading ? (
										<>
											<Loader />
										</>
									) : (
										links
											.filter(d => d.name.toLowerCase().includes(this.search.toLowerCase()))
											.map(w => {
												return (
													<div
														className="wallet-icon"
														onClick={() => {
															const href = browserUtils.formatIOSMobile(
																!domain.walletConnectState.loading &&
																	!domain.walletConnectState.connected
																	? domain.walletConnectState.url
																	: '',
																w,
															);
															browserUtils.saveMobileLinkInfo({
																name: w.name,
																href: href,
															});
															window.open(href, '_blank');
														}}
													>
														<div className="wallet-icon-block">
															<div className="wallet-icon-image">
																<img
																	src={w.logo}
																	alt="Wallet Logo"
																	style={{ width: 32, height: 32, borderRadius: 6 }}
																/>
															</div>
														</div>
														<div className="wallet-icon-title">{w.name}</div>
													</div>
												);
											})
									)}
								</div>
							</div>
						) : this.activeTab === 'install' ? (
							<>
								<input className="wallets-search" placeholder="Search" type="text" />
								<div className="wallets-list">
									{this.walletsToInstall
										.filter(w =>
											walletsMap[w]
												? walletsMap[w].title.toLowerCase().includes(this.search.toLowerCase())
												: false,
										)
										.map(w => {
											const wData = walletsMap[w];
											return (
												<div
													className="wallet-icon"
													key={w}
													onClick={() => {
														window.open(wData.link, '_blank');
													}}
												>
													<div className="wallet-icon-block">
														<div className="wallet-icon-image">{wData.logo(32)}</div>
													</div>
													<div className="wallet-icon-title">{wData.title}</div>
												</div>
											);
										})}
								</div>
							</>
						) : null}
					</div>
				</div>
			</div>
		);
	}
}
