import {
	Ylide,
	BlockchainMap,
	BlockchainWalletMap,
	IGenericAccount,
	YlideKeyPair,
	YlideKeyStore,
	BrowserIframeStorage,
	AbstractWalletController,
	AbstractBlockchainController,
} from '@ylide/sdk';
import { everscaleBlockchainFactory, everscaleWalletFactory } from '@ylide/everscale';
import { computed, makeAutoObservable } from 'mobx';
import modals from './Modals';
import contacts from './Contacts';
import mailer from './Mailer';

Ylide.registerBlockchainFactory(everscaleBlockchainFactory);
Ylide.registerWalletFactory(everscaleWalletFactory);

export interface ConnectedKey {
	blockchain: string;
	address: string;
	key: YlideKeyPair;
	wallet: AbstractWalletController;
}

class Domain {
	savedPassword: string | null = null;

	storage = new BrowserIframeStorage();
	keystore = new YlideKeyStore(this.storage, {
		onPasswordRequest: this.handlePasswordRequest.bind(this),
		onDeriveRequest: this.handleDeriveRequest.bind(this),
	});

	initialized = false;

	ylide: Ylide = new Ylide(this.keystore);

	readers: BlockchainMap<AbstractBlockchainController> = {};
	availableReaders: { blockchain: string }[] = [];
	senders: BlockchainWalletMap<AbstractWalletController> = {};
	availableSenders: { blockchain: string; wallet: string }[] = [];
	availableWallets: { blockchain: string; wallet: string }[] = [];
	connectedWallets: {
		blockchain: string;
		wallet: string;
		account: IGenericAccount;
	}[] = [];
	connectedKeys: ConnectedKey[] = [];

	constructor() {
		makeAutoObservable(this);
	}

	isAddressValid(address: string): null | { blockchain: string } {
		for (const blockchain of Object.keys(this.readers)) {
			const reader = this.readers[blockchain];
			if (reader.isAddressValid(address)) {
				return {
					blockchain,
				};
			}
		}
		return null;
	}

	async removeKey(dk: ConnectedKey) {
		const key = this.keystore.keys.find(key => key.key === dk.key);
		await this.keystore.delete(key!);
		await this.extractWalletsData();
	}

	async handlePasswordRequest(reason: string) {
		return new Promise<string | null>((resolve, reject) => {
			if (domain.savedPassword) {
				return resolve(domain.savedPassword);
			}
			modals.passwordModalVisible = true;
			modals.passwordModalReason = reason;
			modals.passwordModalHandler = resolve;
		});
	}

	async handleDeriveRequest(
		reason: string,
		blockchain: string,
		wallet: string,
		address: string,
		magicString: string,
	) {
		const w = this.connectedWallets.find(t => t.blockchain === blockchain && t.account.address === address)!;
		const sender = this.senders[blockchain][w.wallet];
		try {
			return sender.signMagicString(magicString);
		} catch (err) {
			return null;
		}
	}

	get areThereAnyConnectedKeys() {
		return !!this.connectedKeys.length;
	}

	async extractWalletsData() {
		this.availableSenders = Ylide.walletsList;
		this.availableReaders = Ylide.blockchainsList;
		this.availableWallets = await Ylide.getAvailableWallets();
		for (const wallet of this.availableWallets) {
			if (!this.senders[wallet.blockchain] || !this.senders[wallet.blockchain][wallet.wallet]) {
				this.senders[wallet.blockchain] = {
					...(this.senders[wallet.blockchain] || {}),
					[wallet.wallet]: (
						await this.ylide.addWallet(wallet.blockchain, wallet.wallet, {
							dev: false, //document.location.hostname === 'localhost',
						})
					).walletController,
				};
			}
			this.readers[wallet.blockchain] = this.senders[wallet.blockchain][wallet.wallet].blockchainController;
		}
		for (const blockchain of Object.keys(this.senders)) {
			for (const wallet of Object.keys(this.senders[blockchain])) {
				const sender = this.senders[blockchain][wallet];
				const account = await sender.getAuthenticatedAccount();
				if (account) {
					this.connectedWallets.push({
						blockchain,
						wallet,
						account,
					});
				}
			}
		}
		for (const { blockchain } of this.availableReaders) {
			if (!this.readers[blockchain]) {
				this.readers[blockchain] = await this.ylide.addBlockchain(blockchain, {
					dev: false, //document.location.hostname === 'localhost',
				});
			}
		}
		this.connectedKeys = this.keystore.keys
			.map(key => {
				const cw = this.connectedWallets.find(
					w => w.blockchain === key.blockchain && w.account.address === key.address,
				);
				if (!cw) {
					return null;
				}
				return {
					blockchain: key.blockchain,
					address: key.address,
					key: key.key,
					wallet: this.senders[cw.blockchain][cw.wallet],
				};
			})
			.filter(t => !!t)
			.map(t => t!);
	}

	async init() {
		if (this.initialized) {
			return;
		}

		await this.keystore.init();

		await contacts.init();
		await mailer.init();

		await this.extractWalletsData();

		this.initialized = true;
	}

	@computed get isFirstTime() {
		return this.connectedKeys.length === 0;
	}

	@computed get everscaleKey() {
		return domain.connectedKeys.find(t => t.blockchain === 'everscale')!;
	}
}

//@ts-ignore
const domain = (window.domain = new Domain());
export default domain;
