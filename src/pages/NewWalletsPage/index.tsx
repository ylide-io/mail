import { PureComponent } from 'react';
import { blockchainsMap, walletsMap } from '../../constants';
import { AdaptiveAddress } from '../../controls/AdaptiveAddress';
import { CrossIcon } from '../../icons/CrossIcon';
import { EthereumLogo } from '../../icons/EthereumLogo';
import { MetaMaskLogo } from '../../icons/MetaMaskLogo';
import { YlideLargeLogo } from '../../icons/YlideLargeLogo';
import domain from '../../stores/Domain';

export default class NewWalletsPage extends PureComponent {
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
					<div className="connected-wallets">
						{domain.accounts.accounts.map(acc => {
							console.log('acc.wallet.wallet: ', acc.wallet.wallet);
							return (
								<div className="cw-block" key={acc.account.address}>
									<div className="cw-logo">
										{walletsMap[acc.wallet.wallet].logo(32)}
										{/* <div className="cw-blockchain">
											{blockchainsMap[acc.account.blockchain].logo(16)}
										</div> */}
									</div>
									<div className="cw-title">{walletsMap[acc.wallet.wallet].title}</div>
									<div className="cw-subtitle">
										<AdaptiveAddress address={acc.account.address} />
									</div>
									<div className="cw-delete">
										<CrossIcon size={9} />
									</div>
								</div>
							);
						})}
						<div className="cw-block emphaized">
							<div className="cw-logo">
								<svg
									width="28"
									height="28"
									viewBox="0 0 28 28"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill-rule="evenodd"
										clip-rule="evenodd"
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
