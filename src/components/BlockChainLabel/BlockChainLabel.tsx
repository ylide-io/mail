import React from 'react';

import { blockchainMeta } from '../../utils/blockchain';
import css from './BlockChainLabel.module.scss';

export interface BlockChainLabelProps {
	blockchain: string;
}

export function BlockChainLabel({ blockchain }: BlockChainLabelProps) {
	return (
		<div className={css.root}>
			{blockchainMeta[blockchain].logo(12)}
			{blockchain.toUpperCase()}
		</div>
	);
}
