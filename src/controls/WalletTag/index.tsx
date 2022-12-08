import { walletsMap } from '../../constants';
import { AdaptiveAddress } from '../AdaptiveAddress';

export function WalletTag({ wallet, address }: { wallet: string; address: string }) {
	const wData = walletsMap[wallet];

	return (
		<div className="wallet-tag">
			<div className="wallet-logo">{wData.logo(20)}</div>
			<div className="wallet-name">{wData.title}</div>
			<div className="account-address">
				<AdaptiveAddress address={address} />
			</div>
		</div>
	);
}
