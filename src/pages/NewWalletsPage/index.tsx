import clsx from 'clsx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import { blockchainsMap, walletsMap } from '../../constants';
import { AdaptiveAddress } from '../../controls/AdaptiveAddress';
import { YlideButton } from '../../controls/YlideButton';
import { ArrowRight } from '../../icons/ArrowRight';
import { CrossIcon } from '../../icons/CrossIcon';
import { YlideLargeLogo } from '../../icons/YlideLargeLogo';
import NewPasswordModal from '../../modals/NewPasswordModal';
import SelectWalletModal from '../../modals/SelectWalletModal';
import domain from '../../stores/Domain';
import { getQueryString } from '../../utils/getQueryString';
import { useNav } from '../../utils/navigate';

function NextButton() {
	const navigate = useNav();

	return (
		<YlideButton
			style={{ marginTop: 20 }}
			onClick={() => {
				navigate(`/feed/main`);
			}}
		>
			Continue with connected accounts <ArrowRight style={{ marginLeft: 10 }} />
		</YlideButton>
	);
}

@observer
export class NewWalletsPage extends PureComponent {
	render() {
		return (
			<div className="intro-page">
				<div className="intro-header">
					<YlideLargeLogo />
				</div>
				<div className="intro-body">
					<h2 className="intro-main-title">Connect your wallets</h2>
					<h3 className="intro-main-subtitle">
						Ylide Social Hub supports multiple accounts being connected at once. Connect one by one the
						accounts you want to aggregate and continue when done.
					</h3>
					{domain.accounts.activeAccounts.length ? <NextButton /> : null}
					<div className="connected-wallets">
						{domain.accounts.accounts.map(acc => {
							const isActive = domain.accounts.activeAccounts.find(
								a => a.account.address === acc.account.address,
							);
							return (
								<div className={clsx('cw-block', { notActive: !isActive })} key={acc.account.address}>
									<div className="cw-logo">
										{walletsMap[acc.wallet.wallet].logo(isActive ? 32 : 24)}
										{/* <div className="cw-blockchain">
											{blockchainsMap[acc.account.blockchain].logo(16)}
										</div> */}
									</div>
									<div className="cw-title">
										<span>{walletsMap[acc.wallet.wallet].title}</span>
										{!isActive && <span style={{ fontSize: 12, marginLeft: 4 }}>[not active]</span>}
									</div>
									<div className="cw-subtitle">
										<div
											style={{
												display: 'flex',
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'center',
												flexGrow: 1,
											}}
										>
											<AdaptiveAddress address={acc.account.address} />
										</div>
									</div>
									{!isActive ? (
										<div>
											<YlideButton
												size="small"
												nice
												onClick={async () => {
													const wallet = acc.wallet;
													const remoteKeys = await wallet.readRemoteKeys(acc.account);
													const qqs = getQueryString();
													await NewPasswordModal.show(
														['polygon', 'fantom', 'gnosis'].includes(qqs.faucet)
															? (qqs.faucet as any)
															: 'gnosis',
														qqs.bonus === 'true',
														wallet,
														acc.account,
														remoteKeys.remoteKeys,
													);
												}}
											>
												Activate
											</YlideButton>
										</div>
									) : null}
									<div
										className="cw-delete"
										onClick={async () => {
											if (acc.wallet.factory.wallet === 'walletconnect') {
												await (
													domain.walletControllers.evm.walletconnect as any
												)?.writeWeb3.currentProvider.disconnect();
											}
											await acc.wallet.disconnectAccount(acc);
											await domain.accounts.removeAccount(acc);
											if (acc.wallet.factory.wallet === 'walletconnect') {
												document.location.reload();
											}
										}}
									>
										<CrossIcon size={9} />
									</div>
								</div>
							);
						})}
						<div
							className="cw-block emphaized"
							onClick={() => {
								SelectWalletModal.show();
							}}
						>
							<div className="cw-logo">
								<svg
									width="28"
									height="28"
									viewBox="0 0 28 28"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M14 0C13.1716 0 12.5 0.671574 12.5 1.5V12.5H1.5C0.671573 12.5 0 13.1716 0 14C0 14.8284 0.671574 15.5 1.5 15.5H12.5V26.5C12.5 27.3284 13.1716 28 14 28C14.8284 28 15.5 27.3284 15.5 26.5V15.5L26.5 15.5C27.3284 15.5 28 14.8284 28 14C28 13.1716 27.3284 12.5 26.5 12.5L15.5 12.5V1.5C15.5 0.671573 14.8284 0 14 0Z"
										fill="white"
									/>
								</svg>
							</div>
							<div className="cw-title">Add new wallet</div>
							<div className="cw-subtitle"></div>
						</div>
					</div>
					<h3 className="intro-wallets-subtitle">Supported blockchains</h3>
					<div className="intro-blockchains-list">
						{domain.getRegisteredBlockchains().map(bc => (
							<div className="bc-block" key={bc.blockchain}>
								<div className="bc-logo">{blockchainsMap[bc.blockchain].logo(32)}</div>
								<div className="bc-title">{blockchainsMap[bc.blockchain].title}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}
}
