import { makeAutoObservable } from 'mobx';

export class BalancesStore {
	private balances: Record<string, number> = {};

	constructor() {
		makeAutoObservable(this);
	}

	getBalance(chain: string) {
		return this.balances[chain] || 0;
	}

	setBalance(chain: string, balance: number) {
		this.balances[chain] = balance;
	}
}
