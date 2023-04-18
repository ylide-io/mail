import clsx from 'clsx';
import { observer } from 'mobx-react';
import React from 'react';
import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../components/adaptiveAddress/adaptiveAddress';
import { showStaticComponent } from '../../components/staticComponentManager/staticComponentManager';
import { APP_NAME } from '../../constants';
import { ReactComponent as CrossSvg } from '../../icons/ic20/cross.svg';
import { ReactComponent as NextSvg } from '../../icons/ic28/next.svg';
import { YlideLargeLogo } from '../../icons/YlideLargeLogo';
import { AccountConnectedModal } from '../../modals/accountConnectedModal/accountConnectedModal';
import { NewPasswordModal } from '../../modals/NewPasswordModal';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { RoutePath } from '../../stores/routePath';
import { connectAccount } from '../../utils/account';
import { blockchainMeta } from '../../utils/blockchain';
import { getQueryString } from '../../utils/getQueryString';
import { useNav } from '../../utils/url';
import { walletsMeta } from '../../utils/wallet';

export const NewWalletsPage = observer(() => {
	const navigate = useNav();

	return (
		<div className="intro-page">
			<div className="intro-header">
				<YlideLargeLogo />
			</div>
			<div className="intro-body">
				<h2 className="intro-main-title">Connect your wallets</h2>

				<h3 className="intro-main-subtitle">
					{APP_NAME} supports multiple accounts being connected at once. Connect one by one the accounts you
					want to aggregate and continue when done.
				</h3>

				{!!domain.accounts.activeAccounts.length && (
					<ActionButton
						size={ActionButtonSize.XLARGE}
						look={ActionButtonLook.PRIMARY}
						style={{ marginTop: 20 }}
						onClick={() => {
							navigate(generatePath(RoutePath.ROOT));
						}}
					>
						<div style={{ display: 'grid', gridAutoFlow: 'column', alignItems: 'center', gridGap: 8 }}>
							Continue with connected accounts
							<NextSvg />
						</div>
					</ActionButton>
				)}

				<div className="connected-wallets">
					{domain.accounts.accounts.map(acc => {
						const isActive = domain.accounts.activeAccounts.find(
							a => a.account.address === acc.account.address,
						);
						return (
							<div className={clsx('cw-block', { notActive: !isActive })} key={acc.account.address}>
								<div className="cw-logo">{walletsMeta[acc.wallet.wallet].logo(isActive ? 32 : 24)}</div>
								<div className="cw-title">
									<span>{walletsMeta[acc.wallet.wallet].title}</span>
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

								{!isActive && (
									<ActionButton
										look={ActionButtonLook.SECONDARY}
										onClick={async () => {
											const wallet = acc.wallet;
											const remoteKeys = await wallet.readRemoteKeys(acc.account);
											const qqs = getQueryString();

											await showStaticComponent<DomainAccount>(resolve => (
												<NewPasswordModal
													faucetType={
														['polygon', 'fantom', 'gnosis'].includes(qqs.faucet)
															? (qqs.faucet as any)
															: 'gnosis'
													}
													bonus={qqs.bonus === 'true'}
													wallet={wallet}
													account={acc.account}
													remoteKeys={remoteKeys.remoteKeys}
													onClose={resolve}
												/>
											));
										}}
									>
										Activate
									</ActionButton>
								)}

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
									<CrossSvg />
								</div>
							</div>
						);
					})}

					<div
						className="cw-block emphaized"
						onClick={async () => {
							const account = await connectAccount();

							if (account) {
								await showStaticComponent(resolve => <AccountConnectedModal onClose={resolve} />);
							}
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
							<div className="bc-logo">{blockchainMeta[bc.blockchain].logo(32)}</div>
							<div className="bc-title">{blockchainMeta[bc.blockchain].title}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
});
