import { WalletAccount } from '@ylide/sdk';
import { computed, makeObservable, observable } from 'mobx';

import { browserStorage } from './browserStorage';
import { Domain } from './Domain';
import { DomainAccount } from './models/DomainAccount';
import { Wallet } from './models/Wallet';

export class Accounts {
	@observable accounts: DomainAccount[] = [];

	constructor(public readonly domain: Domain) {
		makeObservable(this);
	}

	save() {
		browserStorage.savedAccounts = this.accounts.map(acc => ({
			name: acc.name,
			account: acc.account,
			blockchainGroup: acc.wallet.factory.blockchainGroup,
			wallet: acc.wallet.factory.wallet,
		}));
	}

	async createNewDomainAccount(wallet: Wallet, account: WalletAccount) {
		const domainAccount = new DomainAccount(
			this.domain.keyRegistry,
			wallet,
			account,
			account.address.toLowerCase(),
		);
		this.accounts.push(domainAccount);
		wallet.accounts.push(domainAccount);
		this.save();
		return domainAccount;
	}

	async load() {
		const savedAccounts = browserStorage.savedAccounts;
		for (const acc of savedAccounts) {
			const wallet = this.domain.wallets.find(w => w.factory.wallet === acc.wallet);
			if (!wallet) {
				continue;
			}

			const account = this.accounts.find(a => a.account.address === acc.account.address);
			if (account) {
				continue;
			}

			const domainAccount = new DomainAccount(this.domain.keyRegistry, wallet, acc.account, acc.name);

			if (!domainAccount.freshestRemotePublicKey) {
				await domainAccount.firstTimeReadRemoteKeys();
				domainAccount.backgroundReadKeysHistory();
			} else {
				domainAccount.backgroundCheckForNewRemoteKeys();
				domainAccount.backgroundReadKeysHistory();
			}

			this.accounts.push(domainAccount);
			wallet.accounts.push(domainAccount);
		}
	}

	async init() {
		await this.load();
	}

	async removeAccount(account: DomainAccount) {
		const idx = this.accounts.indexOf(account);
		if (idx > -1) {
			this.accounts.splice(idx, 1);
		}
		const widx = account.wallet.accounts.indexOf(account);
		if (widx > -1) {
			account.wallet.accounts.splice(widx, 1);
		}
		for (const privateKey of account.localPrivateKeys) {
			await this.domain.keyRegistry.removeLocalPrivateKey(privateKey);
		}
		this.save();
	}

	@computed get activeAccounts() {
		return this.accounts.filter(a => a.isAnyLocalPrivateKeyRegistered);
	}

	@computed get hasActiveAccounts() {
		return !!this.activeAccounts.length;
	}
}
