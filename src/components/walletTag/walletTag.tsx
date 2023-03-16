import { walletsMeta } from '../../utils/wallet';
import { AdaptiveAddress } from '../adaptiveAddress/adaptiveAddress';
import css from './walletTag.module.scss';

export function WalletTag({ wallet, address }: { wallet: string; address: string }) {
	return (
		<div className={css.root}>
			<div className={css.logo}>{walletsMeta[wallet].logo(20)}</div>
			<div className={css.name}>{walletsMeta[wallet].title}</div>
			<div className={css.address}>
				<AdaptiveAddress address={address} />
			</div>
		</div>
	);
}
