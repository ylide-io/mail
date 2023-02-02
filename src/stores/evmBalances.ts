import { EVMNetwork } from '@ylide/ethereum';
import create from 'zustand';

import { evmNameToNetwork } from '../constants';
import { Wallet } from './models/Wallet';

interface EvmBalancesStore {
	balances: Record<EVMNetwork, number>;
	updateBalances: (wallet: Wallet, address: string) => Promise<Record<EVMNetwork, number>>;
}

export const useEvmBalancesStore = create<EvmBalancesStore>((setState, getState) => ({
	balances: {
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
	},

	updateBalances: async (wallet, address) => {
		const rawBalances = await wallet.getBalancesOf(address);
		const result = { ...getState().balances };

		for (const bcName of Object.keys(rawBalances)) {
			const network = evmNameToNetwork(bcName);
			if (network) {
				result[network] = rawBalances[bcName].number;
			}
		}

		setState({ balances: result });

		return result;
	},
}));
