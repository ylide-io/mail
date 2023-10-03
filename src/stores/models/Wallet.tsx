import { EVMWalletController } from '@ylide/ethereum';
import {
	AbstractWalletController,
	PrivateKeyAvailabilityState,
	WalletAccount,
	WalletControllerFactory,
	WalletEvent,
	YlideKeyVersion,
} from '@ylide/sdk';
import { autobind } from 'core-decorators';
import EventEmitter from 'eventemitter3';
import { computed, makeObservable, observable } from 'mobx';

import { BalancesStore } from '../balancesStore';
import { Domain } from '../Domain';
import { DomainAccount } from './DomainAccount';

export class Wallet extends EventEmitter {
	wallet: string;
	factory: WalletControllerFactory;
	controller: AbstractWalletController;

	@observable private _isAvailable: boolean = false;
	@observable private _accounts: DomainAccount[] = [];

	@observable currentWalletAccount: WalletAccount | null = null;
	@observable currentBlockchain: string = 'unknown';

	constructor(
		public readonly domain: Domain,
		factory: WalletControllerFactory,
		controller: AbstractWalletController,
	) {
		super();

		makeObservable(this);
		this.wallet = factory.wallet;
		this.factory = factory;
		this.controller = controller;
	}

	async init() {
		await this.checkAvailability();

		try {
			this.currentBlockchain = await this.controller.getCurrentBlockchain();
		} catch (err) {
			this.currentBlockchain = 'unknown';
		}
		this.currentWalletAccount = await this.controller.getAuthenticatedAccount();

		this.controller.on(WalletEvent.ACCOUNT_CHANGED, this.handleAccountChanged);
		this.controller.on(WalletEvent.LOGIN, this.handleAccountLogin);
		this.controller.on(WalletEvent.LOGOUT, this.handleAccountLogout);

		this.controller.on(WalletEvent.BLOCKCHAIN_CHANGED, this.handleBlockchainChanged);
	}

	destroy() {
		this.controller.off(WalletEvent.ACCOUNT_CHANGED, this.handleAccountChanged);
		this.controller.off(WalletEvent.LOGIN, this.handleAccountLogin);
		this.controller.off(WalletEvent.LOGOUT, this.handleAccountLogout);

		this.controller.off(WalletEvent.BLOCKCHAIN_CHANGED, this.handleBlockchainChanged);
	}

	@autobind
	handleAccountChanged(newAccount: WalletAccount) {
		this.currentWalletAccount = newAccount;
		this.emit('accountUpdate', this.currentWalletAccount);
	}

	@autobind
	handleAccountLogin(newAccount: WalletAccount) {
		this.currentWalletAccount = newAccount;
		this.emit('accountUpdate', this.currentWalletAccount);
	}

	@autobind
	handleAccountLogout() {
		this.currentWalletAccount = null;
		this.emit('accountUpdate', this.currentWalletAccount);
	}

	@autobind
	handleBlockchainChanged(newBlockchain: string) {
		this.currentBlockchain = newBlockchain;
	}

	async checkAvailability() {
		this._isAvailable = await this.factory.isWalletAvailable();
	}

	@computed get isAvailable() {
		return this._isAvailable;
	}

	@computed get accounts(): DomainAccount[] {
		return this._accounts;
	}

	@computed get currentDomainAccount(): DomainAccount | null {
		return this.accounts.find(a => this.isItCurrentAccount(a)) || null;
	}

	isItCurrentAccount(account: DomainAccount): boolean {
		return account.account.address === this.currentWalletAccount?.address;
	}

	isAccountRegistered(account: WalletAccount): boolean {
		return this.accounts.some(a => a.account.address === account.address);
	}

	async createNewDomainAccount(account: WalletAccount) {
		return await this.domain.accounts.createNewDomainAccount(this, account);
	}

	async constructLocalKeyV3(account: WalletAccount) {
		return await this.domain.keysRegistry.instantiateNewPrivateKey(
			account.blockchainGroup,
			account.address,
			YlideKeyVersion.KEY_V3,
			PrivateKeyAvailabilityState.AVAILABLE,
			{
				onPrivateKeyRequest: async (_address, magicString) =>
					await this.controller.signMagicString(account, magicString),
			},
		);
	}

	async constructLocalKeyV2(account: WalletAccount, password: string) {
		return await this.domain.keysRegistry.instantiateNewPrivateKey(
			account.blockchainGroup,
			account.address,
			YlideKeyVersion.KEY_V2,
			PrivateKeyAvailabilityState.AVAILABLE,
			{
				onPrivateKeyRequest: async (_address, magicString) =>
					await this.controller.signMagicString(account, magicString),
				onYlidePasswordRequest: async _address => password,
			},
		);
	}

	async constructLocalKeyV1(account: WalletAccount, password: string) {
		return await this.domain.keysRegistry.instantiateNewPrivateKey(
			account.blockchainGroup,
			account.address,
			YlideKeyVersion.INSECURE_KEY_V1,
			PrivateKeyAvailabilityState.AVAILABLE,
			{
				onPrivateKeyRequest: async (_address, magicString) =>
					await this.controller.signMagicString(account, magicString),
				onYlidePasswordRequest: async _address => password,
			},
		);
	}

	async constructMainViewKey(account: WalletAccount) {
		if (!(this.controller instanceof EVMWalletController)) {
			throw new Error('Not implemented');
		}
		const messageTimestamp = Math.floor(Date.now() / 1000);
		const sig = await this.controller.signString(
			account,
			`Ylide authorization, ${account.address.toLowerCase()}, timestamp: ${messageTimestamp}`,
		);
		return {
			signature: sig.r + sig.s.substring(2) + sig.v.toString(16),
			timestamp: messageTimestamp,
		};
	}

	async getCurrentAccount(): Promise<WalletAccount | null> {
		return await this.controller.getAuthenticatedAccount();
	}

	async disconnectAccount(account: DomainAccount) {
		if (account.wallet.isItCurrentAccount(account)) {
			await this.controller.disconnectAccount(account.account);
		}
	}

	async connectAccount() {
		let acc = await this.getCurrentAccount();
		if (!acc) {
			acc = await this.controller.requestAuthentication();
		}
		return acc;
	}

	getBalancesOf(address: string): BalancesStore {
		const store = new BalancesStore();

		this.domain.registeredBlockchains
			.filter(bc => bc.blockchainGroup === this.factory.blockchainGroup)
			.forEach(async chain => {
				const balance = await this.domain.blockchains[chain.blockchain].getBalance(address);
				store.setBalance(chain.blockchain, balance.numeric);
			});

		return store;
	}
}
