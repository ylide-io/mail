import { EVMNetwork } from '@ylide/ethereum';
import { makeAutoObservable, transaction } from 'mobx';

import { evmNameToNetwork } from '../utils/blockchain';
import { Wallet } from './models/Wallet';

export class EvmBalances {
	private balances: Partial<Record<EVMNetwork, number>> = {};

	constructor() {
		makeAutoObservable(this);
	}

	getBalance(network: EVMNetwork) {
		return this.balances[network] || 0;
	}

	async updateBalances(wallet: Wallet, address: string) {
		const rawBalances = await wallet.getBalancesOf(address);

		transaction(() => {
			for (const bcName of Object.keys(rawBalances)) {
				const network = evmNameToNetwork(bcName);
				if (network !== undefined) {
					this.balances[network] = rawBalances[bcName].numeric;
				}
			}
		});

		return this.balances;
	}
}
