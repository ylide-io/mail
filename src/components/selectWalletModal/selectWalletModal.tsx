import * as browserUtils from '@walletconnect/browser-utils';
import clsx from 'clsx';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';

import domain from '../../stores/Domain';
import { Wallet } from '../../stores/models/Wallet';
import walletConnect from '../../stores/WalletConnect';
import { copyToClipboard } from '../../utils/clipboard';
import { walletsMeta } from '../../utils/wallet';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { Modal } from '../modal/modal';
import { TextField, TextFieldLook } from '../textField/textField';
import { YlideLoader } from '../ylideLoader/ylideLoader';

interface SelectWalletModalProps {
	onClose?: (wallet?: Wallet) => void;
}

export const SelectWalletModal = observer(({ onClose }: SelectWalletModalProps) => {
	const isMobile = browserUtils.isMobile();
	const isDesktop = !isMobile;

	const platform = isMobile ? 'mobile' : 'desktop';
	const links = browserUtils.getMobileLinkRegistry(
		browserUtils.formatMobileRegistry(walletConnect.registry, platform),
	);

	useEffect(() => {
		const reloadWallets = async () => {
			await domain.reloadAvailableWallets();
			await domain.extractWalletsData();
		};

		// such a shit. fuck VenomWallet :(
		reloadWallets();
		setTimeout(reloadWallets, 1000);
		setTimeout(reloadWallets, 2000);
	}, []);

	const [copy, setCopy] = useState(false);
	const [activeTab, setActiveTab] = useState<'qr' | 'desktop' | 'install'>(
		!domain.walletConnectState.loading && domain.walletConnectState.connected ? 'install' : 'qr',
	);
	const [search, setSearch] = useState('');

	const availableWallets = domain.availableWallets;

	const availableBrowserWallets = useMemo(
		() =>
			Object.entries(walletsMeta)
				.filter(
					([wallet, meta]) =>
						wallet !== 'walletconnect' &&
						!!availableWallets.find(ww => ww.wallet === wallet) &&
						!meta.isProxy,
				)
				.map(([wallet]) => wallet),
		[availableWallets],
	);

	const walletsToInstall = useMemo(
		() =>
			Object.entries(walletsMeta)
				.filter(([wallet, meta]) => !availableBrowserWallets.includes(wallet) && !meta.isProxy)
				.map(([wallet]) => wallet),
		[availableBrowserWallets],
	);

	useEffect(
		() =>
			reaction(
				() => domain.wallets.find(w => w.factory.wallet === 'walletconnect'),
				(wc, prev) => {
					if (!prev && wc) {
						onClose?.(wc);
					}
				},
			),
		[onClose],
	);

	function renderWalletConnectAlreadyUsed(walletName: string) {
		return (
			<div className="overall">
				WalletConnect can be used to connect only one account.
				<br />
				<br />
				Please, use native browser extensions to connect more wallets or disconnect current WalletConnect
				connection.
				<br />
				<br />
				<ActionButton
					isMultiline
					size={ActionButtonSize.MEDIUM}
					look={ActionButtonLook.SECONDARY}
					onClick={() => domain.disconnectWalletConnect()}
				>
					Disconnect WalletConnect
					<br />({walletName})
				</ActionButton>
			</div>
		);
	}

	return (
		<Modal className="wallet-modal" onClose={onClose}>
			<h3 className="wm-title">Select wallet</h3>

			{!!availableBrowserWallets.length && (
				<div className="available-wallets">
					<div className="aw-title">Available browser extensions</div>
					<div className="wallets-container">
						{availableBrowserWallets.map(w => (
							<div
								className="wallet-icon"
								key={w}
								onClick={() => onClose?.(domain.wallets.find(it => it.wallet === w))}
							>
								<div className="wallet-icon-block">
									<div className="wallet-icon-image">{walletsMeta[w].logo(32)}</div>
								</div>
								<div className="wallet-icon-title">{walletsMeta[w].title}</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="wm-tabs">
				{isDesktop ? (
					<>
						<div
							onClick={() => {
								setActiveTab('qr');
								setSearch('');
							}}
							className={clsx('wm-tab', { active: activeTab === 'qr' })}
						>
							QR code
						</div>
						<div
							onClick={() => {
								setActiveTab('desktop');
								setSearch('');
							}}
							className={clsx('wm-tab', { active: activeTab === 'desktop' })}
						>
							Desktop
						</div>
						<div
							onClick={() => {
								setActiveTab('install');
								setSearch('');
							}}
							className={clsx('wm-tab', { active: activeTab === 'install' })}
						>
							Install
						</div>
					</>
				) : (
					<>
						<div
							onClick={() => {
								setActiveTab('qr');
								setSearch('');
							}}
							className={clsx('wm-tab', { active: activeTab === 'qr' })}
						>
							Mobile
						</div>
					</>
				)}
			</div>

			<div className="wm-tab-content">
				{activeTab === 'qr' ? (
					isDesktop ? (
						<div className="qr-content">
							{!domain.walletConnectState.loading && domain.walletConnectState.connected ? (
								renderWalletConnectAlreadyUsed(domain.walletConnectState.walletName)
							) : (
								<>
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
										<br />a WalletConnect compatible wallet
									</div>
									<a
										href="#copy-link"
										onClick={() => {
											copyToClipboard(
												!domain.walletConnectState.loading &&
													!domain.walletConnectState.connected
													? domain.walletConnectState.url
													: '',
											);
											setCopy(true);
											setTimeout(() => setCopy(false), 1000);
										}}
										className="qr-link"
									>
										{copy ? 'Copied' : 'Copy to clipboard'}
									</a>
								</>
							)}
						</div>
					) : (
						<>
							{!domain.walletConnectState.loading && domain.walletConnectState.connected ? (
								renderWalletConnectAlreadyUsed(domain.walletConnectState.walletName)
							) : (
								<>
									<TextField
										className="wm-tab-search"
										look={TextFieldLook.LITE}
										type="text"
										placeholder="Search"
										value={search}
										onValueChange={setSearch}
									/>

									<div className="wallets-list">
										{walletConnect.loading ? (
											<YlideLoader />
										) : (
											links
												.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
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
								</>
							)}
						</>
					)
				) : activeTab === 'desktop' ? (
					<>
						{!domain.walletConnectState.loading && domain.walletConnectState.connected ? (
							renderWalletConnectAlreadyUsed(domain.walletConnectState.walletName)
						) : (
							<>
								<TextField
									className="wm-tab-search"
									look={TextFieldLook.LITE}
									type="text"
									placeholder="Search"
									value={search}
									onValueChange={setSearch}
								/>

								<div className="wallets-list">
									{walletConnect.loading ? (
										<YlideLoader />
									) : (
										links
											.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
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
																	style={{
																		width: 32,
																		height: 32,
																		borderRadius: 6,
																	}}
																/>
															</div>
														</div>
														<div className="wallet-icon-title">{w.name}</div>
													</div>
												);
											})
									)}
								</div>
							</>
						)}
					</>
				) : activeTab === 'install' ? (
					<>
						<TextField
							className="wm-tab-search"
							look={TextFieldLook.LITE}
							type="text"
							placeholder="Search"
							value={search}
							onValueChange={setSearch}
						/>

						<div className="wallets-list">
							{walletsToInstall
								.filter(w =>
									walletsMeta[w]
										? walletsMeta[w].title.toLowerCase().includes(search.toLowerCase())
										: false,
								)
								.map(w => {
									const wData = walletsMeta[w];
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
		</Modal>
	);
});
