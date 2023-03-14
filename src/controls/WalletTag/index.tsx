import { walletsMeta } from '../../utils/wallet';
import { AdaptiveAddress } from '../adaptiveAddress/adaptiveAddress';

export function WalletTag({ wallet, address }: { wallet: string; address: string }) {
	return (
		<div className="wallet-tag">
			<div className="wallet-logo">{walletsMeta[wallet].logo(20)}</div>
			<div className="wallet-name">{walletsMeta[wallet].title}</div>
			<div className="account-address">
				<AdaptiveAddress address={address} />
			</div>
		</div>
	);
}
