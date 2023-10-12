import { WalletAccount } from '@ylide/sdk';
import { computed, makeAutoObservable, makeObservable, observable } from 'mobx';

import { BrowserStorage, BrowserStorageKey } from './browserStorage';
import { Domain } from './Domain';
import { DomainAccount } from './models/DomainAccount';
import { Wallet } from './models/Wallet';

interface SavedAccount {
	name: string;
	account: WalletAccount;
	wallet: string;
}

class SavedAccounts {
	constructor() {
		makeAutoObservable(this);
	}

	private _value =
		BrowserStorage.getItemWithTransform<SavedAccount[]>(BrowserStorageKey.SAVED_ACCOUNTS, val => {
			const parsed = JSON.parse(val);
			if (!Array.isArray(parsed)) {
				return [];
			} else {
				return parsed.map((acc: any) => ({
					...acc,
					account: WalletAccount.fromBase64(acc.account),
				}));
			}
		}) || [];

	get value() {
		return this._value;
	}

	set value(value: SavedAccount[]) {
		BrowserStorage.setItem(
			BrowserStorageKey.SAVED_ACCOUNTS,
			JSON.stringify(
				value.map(v => ({
					...v,
					account: v.account.toBase64(),
				})),
			),
		);
		this._value = value;
	}
}

const savedAccounts = new SavedAccounts();

//

export class Accounts {
	@observable accounts: DomainAccount[] = [];

	constructor(public readonly domain: Domain) {
		makeObservable(this);
	}

	save() {
		savedAccounts.value = this.accounts.map(acc => ({
			name: acc.name,
			account: acc.account,
			blockchainGroup: acc.wallet.factory.blockchainGroup,
			wallet: acc.wallet.factory.wallet,
		}));
	}

	async createNewDomainAccount(wallet: Wallet, account: WalletAccount) {
		const domainAccount = new DomainAccount(this.domain.keysRegistry, wallet, account, '');
		this.accounts.push(domainAccount);
		wallet.accounts.push(domainAccount);
		this.save();
		return domainAccount;
	}

	async load() {
		const value = savedAccounts.value;
		for (const acc of value) {
			const wallet = this.domain.wallets.find(w => w.factory.wallet === acc.wallet);
			if (!wallet) {
				continue;
			}

			const account = this.accounts.find(a => a.account.address === acc.account.address);
			if (account) {
				continue;
			}

			const domainAccount = new DomainAccount(this.domain.keysRegistry, wallet, acc.account, acc.name);

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
			await this.domain.keysRegistry.removeLocalPrivateKey(privateKey);
		}
		this.save();
	}

	@computed get activeAccounts() {
		return this.accounts.filter(a => a.isAnyLocalPrivateKeyRegistered);
	}

	@computed get activeAccountsWithAuthKey() {
		return this.activeAccounts.filter(a => a.authKey);
	}

	@computed get hasActiveAccounts() {
		return !!this.activeAccounts.length;
	}
}
