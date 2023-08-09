import { blockchainMeta } from '../../utils/blockchain';
import css from './BlockChainLabel.module.scss';

export interface BlockChainLabelProps {
	blockchain: string;
}

export function BlockChainLabel({ blockchain }: BlockChainLabelProps) {
	return (
		<div className={css.root}>
			<div className={css.inner}>
				{blockchainMeta[blockchain].logo(12)}
				<div className={css.label}>{blockchain.toUpperCase()}</div>
			</div>
		</div>
	);
}
