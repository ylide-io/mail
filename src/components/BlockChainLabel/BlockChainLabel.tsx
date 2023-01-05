import React from 'react';

import { blockchainsMap } from '../../constants';
import css from './BlockChainLabel.module.scss';

export interface BlockChainLabelProps {
	blockchain: string;
}

export function BlockChainLabel({ blockchain }: BlockChainLabelProps) {
	return (
		<div className={css.root}>
			{blockchainsMap[blockchain].logo(12)}
			{blockchain.toUpperCase()}
		</div>
	);
}
