import clsx from 'clsx';

import { blockchainMeta } from '../../utils/blockchain';
import { PropsWithClassName } from '../props';
import css from './BlockChainLabel.module.scss';

export interface BlockChainLabelProps extends PropsWithClassName {
	blockchain: string;
}

export function BlockChainLabel({ className, blockchain }: BlockChainLabelProps) {
	return (
		<div className={clsx(css.root, className)}>
			<div className={css.inner}>
				{blockchainMeta[blockchain].logo(12)}
				<div className={css.label}>{blockchain.toUpperCase()}</div>
			</div>
		</div>
	);
}
