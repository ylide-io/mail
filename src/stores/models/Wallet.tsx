import { EthereumWalletController } from '@ylide/ethereum';
import {
	AbstractWalletController,
	IGenericAccount,
	WalletControllerFactory,
	WalletEvent,
	YlideKeyPair,
	YlidePublicKeyVersion,
} from '@ylide/sdk';
import { autobind } from 'core-decorators';
import EventEmitter from 'eventemitter3';
import { computed, makeObservable, observable } from 'mobx';

import { AdaptiveAddress } from '../../components/adaptiveAddress/adaptiveAddress';
import { toast } from '../../components/toast/toast';
import { invariant } from '../../utils/assert';
import { browserStorage } from '../browserStorage';
import { Domain } from '../Domain';
import { DomainAccount } from './DomainAccount';

export class Wallet extends EventEmitter {
	wallet: string;
	factory: WalletControllerFactory;
	controller: AbstractWalletController;

	@observable private _isAvailable: boolean = false;
	@observable private _accounts: DomainAccount[] = [];

	@observable currentWalletAccount: IGenericAccount | null = null;
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
	handleAccountChanged(newAccount: IGenericAccount) {
		this.currentWalletAccount = newAccount;
		this.emit('accountUpdate', this.currentWalletAccount);
	}

	@autobind
	handleAccountLogin(newAccount: IGenericAccount) {
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

	isAccountRegistered(account: IGenericAccount): boolean {
		return this.accounts.some(a => a.account.address === account.address);
	}

	async constructLocalKeyV3(account: IGenericAccount) {
		return await this.domain.keystore.constructKeypairV3(
			'New account connection',
			this.factory.blockchainGroup,
			this.factory.wallet,
			account.address,
		);
	}

	async constructLocalKeyV2(account: IGenericAccount, password: string) {
		return await this.domain.keystore.constructKeypairV2(
			'New account connection',
			this.factory.blockchainGroup,
			this.factory.wallet,
			account.address,
			password,
		);
	}

	async constructLocalKeyV1(account: IGenericAccount, password: string) {
		return await this.domain.keystore.constructKeypairV1(
			'New account connection',
			this.factory.blockchainGroup,
			this.factory.wallet,
			account.address,
			password,
		);
	}

	async constructMainViewKey(account: IGenericAccount) {
		if (!(this.controller instanceof EthereumWalletController)) {
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

	async readRemoteKeys(account: IGenericAccount) {
		let result = browserStorage.getAccountRemoteKeys(account.address);

		if (!result) {
			result = await this.domain.ylide.core.getAddressKeys(account.address);
		} else {
			this.domain.ylide.core.getAddressKeys(account.address).then(actual => {
				invariant(result);

				const cachedFK = result.freshestKey;
				const actualFK = actual.freshestKey;

				if (cachedFK?.publicKey.toHex() !== actualFK?.publicKey.toHex()) {
					browserStorage.setAccountRemoteKeys(account.address, undefined);

					toast(
						<>
							<b>
								<AdaptiveAddress maxLength={12} address={account.address} />
							</b>
							<div>
								Your Ylide public keys for this account have been updated. Please re-connect it 🙏
							</div>
						</>,
					);
				}
			});
		}

		return {
			remoteKey: result.freshestKey,
			remoteKeys: result.remoteKeys,
		};
	}

	async getCurrentAccount(): Promise<IGenericAccount | null> {
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

	async instantiateNewAccount(account: IGenericAccount, keypair: YlideKeyPair, keyVersion: YlidePublicKeyVersion) {
		return new Promise<DomainAccount>(async resolve => {
			const existingAcc = this.domain.accounts.accounts.find(
				acc => acc.account.address.toLowerCase() === account.address.toLowerCase(),
			);
			if (existingAcc) {
				return resolve(existingAcc);
			}
			this.domain.accounts.onceNewAccount(account, acc => {
				resolve(acc);
			});
			await this.domain.keystore.storeKey(keypair, keyVersion, this.factory.blockchainGroup, this.factory.wallet);
		});
	}

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
