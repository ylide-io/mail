import { makeAutoObservable, transaction } from 'mobx';

import { Wallet } from './models/Wallet';

export class BalancesStore {
	private balances: Record<string, number> = {};

	isUpdating = false;

	constructor() {
		makeAutoObservable(this);
	}

	getBalance(chain: string) {
		return this.balances[chain] || 0;
	}

	async updateBalances(wallet: Wallet, address: string) {
		this.isUpdating = true;

		const rawBalances = await wallet.getBalancesOf(address);

		transaction(() => {
			Object.keys(rawBalances).forEach(chain => {
				this.balances[chain] = rawBalances[chain].numeric;
			});
		});

		this.isUpdating = false;
	}
}
