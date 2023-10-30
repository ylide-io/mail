import { makeAutoObservable } from 'mobx';

export type BalancesStoreEntry = Record<string, number>;

export class BalancesStore {
	private balances: BalancesStoreEntry = {};

	constructor() {
		makeAutoObservable(this);
	}

	getBalance(chain: string) {
		return this.balances[chain] || 0;
	}

	setBalance(chain: string, balance: number) {
		this.balances[chain] = balance;
	}

	getNonZeroBalances(): BalancesStoreEntry {
		return Object.keys(this.balances).reduce((res, chain) => {
			const balance = this.balances[chain];
			if (balance) {
				res[chain] = balance;
			}
			return res;
		}, {} as BalancesStoreEntry);
	}

	getFirstNonZeroChain(): string | undefined {
		return Object.keys(this.getNonZeroBalances())[0];
	}
}
