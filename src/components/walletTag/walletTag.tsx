import { walletsMeta } from '../../utils/wallet';
import { AdaptiveAddress } from '../adaptiveAddress/adaptiveAddress';
import css from './walletTag.module.scss';

interface WalletTagProps {
	wallet: string;
	address?: string;
}

export function WalletTag({ wallet, address }: WalletTagProps) {
	return (
		<div className={css.root}>
			<div className={css.logo}>{walletsMeta[wallet].logo(20)}</div>
			<div className={css.name}>{walletsMeta[wallet].title}</div>
			{!!address && (
				<div className={css.address}>
					<AdaptiveAddress address={address} />
				</div>
			)}
		</div>
	);
}
