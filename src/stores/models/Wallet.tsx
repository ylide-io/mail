import {
	AbstractWalletController,
	PrivateKeyAvailabilityState,
	WalletAccount,
	WalletControllerFactory,
	WalletEvent,
	YlideKeyVersion,
	YlidePrivateKey,
} from '@ylide/sdk';
import { SmartBuffer } from '@ylide/smart-buffer';
import { autobind } from 'core-decorators';
import EventEmitter from 'eventemitter3';
import { computed, makeObservable, observable } from 'mobx';

import { REACT_APP__MV_PUBLIC_KEY } from '../../env';
import { AuthorizationPayload } from '../../types';
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
				onPrivateKeyRequest: async (address, magicString) =>
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
				onPrivateKeyRequest: async (address, magicString) =>
					await this.controller.signMagicString(account, magicString),
				onYlidePasswordRequest: async address => password,
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
				onPrivateKeyRequest: async (address, magicString) =>
					await this.controller.signMagicString(account, magicString),
				onYlidePasswordRequest: async address => password,
			},
		);
	}

	async constructMainViewKey(
		account: WalletAccount,
		accountPrivateKey: YlidePrivateKey,
		password: string,
	): Promise<AuthorizationPayload> {
		const mvPublicKey = new Uint8Array(Buffer.from(REACT_APP__MV_PUBLIC_KEY!, 'hex'));

		const messageBytes = SmartBuffer.ofUTF8String(
			JSON.stringify({ address: account.address.toLowerCase(), timestamp: Date.now() }),
		).bytes;

		return accountPrivateKey.execute(
			async privateKey => ({
				messageEncrypted: Buffer.from(privateKey.encrypt(messageBytes, mvPublicKey)).toString('hex'),
				publicKey: Buffer.from(privateKey.publicKey).toString('hex'),
				address: account.address,
			}),
			{
				onPrivateKeyRequest: async (address, magicString) =>
					await this.controller.signMagicString(account, magicString),
				onYlidePasswordRequest: async address => password,
			},
		);
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

	// async instantiateNewAccount(account: IGenericAccount, keypair: YlideKeyPair, keyVersion: YlidePublicKeyVersion) {
	// 	return new Promise<DomainAccount>(async resolve => {
	// 		const existingAcc = this.domain.accounts.accounts.find(
	// 			acc => acc.account.address.toLowerCase() === account.address.toLowerCase(),
	// 		);
	// 		if (existingAcc) {
	// 			return resolve(existingAcc);
	// 		}
	// 		this.domain.accounts.onceNewAccount(account, acc => {
	// 			resolve(acc);
	// 		});
	// 		await this.domain.keystore.storeKey(keypair, keyVersion, this.factory.blockchainGroup, this.factory.wallet);
	// 	});
	// }

	async getBalancesOf(address: string): Promise<Record<string, { original: string; numeric: number; e18: string }>> {
		const chains = this.domain.registeredBlockchains.filter(
			bc => bc.blockchainGroup === this.factory.blockchainGroup,
		);
		const balances = await Promise.all(
			chains.map(async chain => {
				return this.domain.blockchains[chain.blockchain].getBalance(address);
			}),
		);
		return chains.reduce(
			(p, c, i) => ({
				...p,
				[c.blockchain]: balances[i],
			}),
			{} as Record<string, { original: string; numeric: number; e18: string }>,
		);
	}

	// async connectNonCurrentAccount() {
	// 	if (this.controller.isMultipleAccountsSupported()) {
	// 		return 'SUGGEST_CHANGE';
	// 	}
	// 	const acc = await this.getCurrentAccount();
	// 	if (acc) {
	// 		await this.controller.disconnectAccount(acc);
	// 	}
	// 	return await this.connectCurrentAccount();
	// }
}
