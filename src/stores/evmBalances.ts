import { EVMNetwork } from '@ylide/ethereum';
import { makeAutoObservable } from 'mobx';

import { evmNameToNetwork } from '../constants';
import { Wallet } from './models/Wallet';

class EvmBalances {
	balances = {
		[EVMNetwork.LOCAL_HARDHAT]: 0,
		[EVMNetwork.ETHEREUM]: 0,
		[EVMNetwork.BNBCHAIN]: 0,
		[EVMNetwork.POLYGON]: 0,
		[EVMNetwork.ARBITRUM]: 0,
		[EVMNetwork.OPTIMISM]: 0,
		[EVMNetwork.AVALANCHE]: 0,
		[EVMNetwork.FANTOM]: 0,
		[EVMNetwork.KLAYTN]: 0,
		[EVMNetwork.GNOSIS]: 0,
		[EVMNetwork.AURORA]: 0,
		[EVMNetwork.CELO]: 0,
		[EVMNetwork.CRONOS]: 0,
		[EVMNetwork.MOONBEAM]: 0,
		[EVMNetwork.MOONRIVER]: 0,
		[EVMNetwork.METIS]: 0,
		[EVMNetwork.ASTAR]: 0,
	};

	constructor() {
		makeAutoObservable(this);
	}

	async updateBalances(wallet: Wallet, address: string) {
		const rawBalances = await wallet.getBalancesOf(address);
		const result = { ...this.balances };

		for (const bcName of Object.keys(rawBalances)) {
			const network = evmNameToNetwork(bcName);
			if (network) {
				result[network] = rawBalances[bcName].numeric;
			}
		}

		this.balances = result;

		return result;
	}
}

export const evmBalances = new EvmBalances();

// @ts-ignore
window.evmBalances = evmBalances;
