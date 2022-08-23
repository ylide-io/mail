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
	BlockchainControllerFactory,
	WalletControllerFactory,
	MessagesList,
	BlockchainSourceSubjectType,
} from '@ylide/sdk';
import { everscaleBlockchainFactory, everscaleWalletFactory } from '@ylide/everscale';
import { EthereumWalletController, ethereumWalletFactory, evmFactories, EVMNetwork, EVM_NAMES } from '@ylide/ethereum';
import { computed, makeAutoObservable, observable } from 'mobx';
import modals from './Modals';
import contacts from './Contacts';
import mailer from './Mailer';

Ylide.registerBlockchainFactory(everscaleBlockchainFactory);
// Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.LOCAL_HARDHAT]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.ETHEREUM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.AVALANCHE]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.ARBITRUM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.BNBCHAIN]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.OPTIMISM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.POLYGON]);
Ylide.registerWalletFactory(everscaleWalletFactory);
Ylide.registerWalletFactory(ethereumWalletFactory);

export class DomainAccount {
	account: IGenericAccount;
	blockchainGroup: string;
	_wallet: string;

	@observable pair: YlideKeyPair | null = null;

	@observable localKey: Uint8Array | null = null;
	@observable remoteKey: Uint8Array | null = null;

	constructor(private readonly domain: Domain, account: IGenericAccount, blockchainGroup: string, wallet: string) {
		makeAutoObservable(this);

		this.account = account;
		this.blockchainGroup = blockchainGroup;
		this._wallet = wallet;
		this.readLocalKey();
	}

	get wallet() {
		if (!this.domain.wallets[this.blockchainGroup] || !this.domain.wallets[this.blockchainGroup][this._wallet]) {
			throw new Error();
		}
		return this.domain.wallets[this.blockchainGroup][this._wallet];
	}

	readLocalKey() {
		const keystoreAccount = this.domain.keystore.get(this.account.address);
		this.localKey = keystoreAccount?.publicKey || null;
	}

	async destroyLocalKey() {
		const key = this.domain.keystore.keys.find(k => k.address === this.account.address);
		if (key) {
			await this.domain.keystore.delete(key);
		}
		this.localKey = null;
	}

	get isKeysEqual() {
		if (!this.localKey) {
			return false;
		}
		if (!this.remoteKey) {
			return false;
		}
		return (
			this.localKey.length === this.remoteKey.length && this.localKey.every((e, i) => e === this.remoteKey![i])
		);
	}

	async readRemoteKey() {
		const blockchainName = await this.wallet.getCurrentBlockchain();
		const blockchain = this.domain.blockchains[blockchainName];
		const pk = await blockchain.extractPublicKeyFromAddress(this.account.address);
		if (pk) {
			this.remoteKey = pk.bytes;
		}
	}

	async createLocalKey(password: string) {
		this.pair = await this.domain.keystore.create(
			'New account connection',
			this.blockchainGroup,
			this._wallet,
			this.account.address,
			password,
		);
		this.localKey = this.pair.publicKey;
	}

	async attachRemoteKey() {
		if (!this.localKey) {
			throw new Error(`Create local key first`);
		}
		const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map((network: EVMNetwork) => ({
			name: EVM_NAMES[network],
			network: Number(network) as EVMNetwork,
		}));
		const blockchainName = await this.wallet.getCurrentBlockchain();
		const network = evmNetworks.find(n => n.name === blockchainName)?.network;
		this.wallet.attachPublicKey(this.account, this.localKey, {
			network,
		});
	}
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

	@observable registeredBlockchains: BlockchainControllerFactory[] = [];
	@observable registeredWallets: WalletControllerFactory[] = [];

	@observable availableWallets: WalletControllerFactory[] = [];

	@observable blockchains: BlockchainMap<AbstractBlockchainController> = {};
	@observable wallets: BlockchainWalletMap<AbstractWalletController> = {};

	@observable accounts: DomainAccount[] = [];

	inbox: MessagesList;
	sent: MessagesList;

	constructor() {
		makeAutoObservable(this);

		this.inbox = new MessagesList();
		this.sent = new MessagesList();
	}

	getBlockchainsForAddress(address: string): { blockchain: string; reader: AbstractBlockchainController }[] {
		return Object.keys(this.blockchains)
			.filter(bc => this.blockchains[bc].isAddressValid(address))
			.map(blockchain => ({
				blockchain,
				reader: this.blockchains[blockchain],
			}));
	}

	async addAccount(blockchainGroup: string, wallet: string) {
		const instance = this.wallets[blockchainGroup][wallet];
		const account = await instance.requestAuthentication();
		if (!account) {
			return;
		}
		const domainAccount = new DomainAccount(this, account, blockchainGroup, wallet);
		domainAccount.readLocalKey();
		await domainAccount.readRemoteKey();
		this.accounts.push(domainAccount);
		await this.activateAccountReading(domainAccount);

		await this.saveAccounts();

		if (this.accounts.length === 1) {
			try {
				this.inbox.readFirstPage();
				this.sent.readFirstPage();
			} catch (err) {
				//
			}
		}

		return domainAccount;
	}

	async activateAccountReading(account: DomainAccount) {
		for (const blockchain of Object.keys(this.blockchains)) {
			const reader = this.blockchains[blockchain];
			this.inbox.addReader(
				reader,
				{
					type: BlockchainSourceSubjectType.RECIPIENT,
					address: account.wallet.addressToUint256(account.account.address),
				},
				10000,
			);
			this.sent.addReader(
				reader,
				{
					type: BlockchainSourceSubjectType.RECIPIENT,
					address: Ylide.getSentAddress(account.wallet.addressToUint256(account.account.address)),
				},
				10000,
			);
		}
	}

	async removeAccount(account: DomainAccount) {
		const idx = this.accounts.indexOf(account);
		if (idx > -1) {
			this.accounts.splice(idx, 1);
		}
		const key = this.keystore.keys.find(k => k.address === account.account.address);
		if (!key) {
			return;
		}
		this.keystore.delete(key);
	}

	// async removeKey(dk: ConnectedKey) {
	// 	const key = this.keystore.keys.find(key => key.key === dk.key);
	// 	await this.keystore.delete(key!);
	// 	await this.extractWalletsData();
	// }

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
		blockchainGroup: string,
		wallet: string,
		address: string,
		magicString: string,
	) {
		try {
			const domainAccount = this.accounts.find(a => a.account.address === address);
			if (domainAccount) {
				return domainAccount.wallet.signMagicString(domainAccount.account, magicString);
			} else {
				return null;
			}
		} catch (err) {
			return null;
		}
	}

	async loadAccounts() {
		console.log('accounts loaded');
		const accs = await this.storage.readJSON<{ accountAddress: string; blockchainGroup: string; wallet: string }[]>(
			'N1_accounts',
		);
		if (accs) {
			for (const acc of accs) {
				const domainAccount = new DomainAccount(
					this,
					{
						address: acc.accountAddress,
						blockchain: acc.blockchainGroup,
						publicKey: null,
					},
					acc.blockchainGroup,
					acc.wallet,
				);
				domainAccount.readLocalKey();
				await domainAccount.readRemoteKey();
				this.accounts.push(domainAccount);
				await this.activateAccountReading(domainAccount);
			}
		}
	}

	async saveAccounts() {
		console.log('accounts saved');
		await this.storage.storeJSON(
			'N1_accounts',
			this.accounts.map<{ accountAddress: string; blockchainGroup: string; wallet: string }>(acc => ({
				accountAddress: acc.account.address,
				blockchainGroup: acc.blockchainGroup,
				wallet: acc._wallet,
			})),
		);
	}

	async extractWalletsData() {
		this.registeredWallets = Ylide.walletsList.map(w => w.factory);
		this.registeredBlockchains = Ylide.blockchainsList.map(b => b.factory);

		this.availableWallets = await Ylide.getAvailableWallets();

		for (const factory of this.availableWallets) {
			if (!this.wallets[factory.blockchainGroup] || !this.wallets[factory.blockchainGroup][factory.wallet]) {
				this.wallets[factory.blockchainGroup] = {
					...(this.wallets[factory.blockchainGroup] || {}),
					[factory.wallet]: await this.ylide.addWallet(factory.blockchainGroup, factory.wallet, {
						dev: false, //document.location.hostname === 'localhost',
						onNetworkSwitchRequest: async (
							reason: string,
							currentNetwork: EVMNetwork | undefined,
							needNetwork: EVMNetwork,
							needChainId: number,
						) => {
							alert(
								'Wrong network (' +
									(currentNetwork ? EVM_NAMES[currentNetwork] : 'undefined') +
									'), switch to ' +
									EVM_NAMES[needNetwork],
							);
						},
					}),
				};
			}
		}
		for (const factory of this.registeredBlockchains) {
			this.blockchains[factory.blockchain] = await this.ylide.addBlockchain(factory.blockchain, {
				dev: false, //document.location.hostname === 'localhost',
			});
		}

		await this.loadAccounts();

		this.inbox.readFirstPage();
		this.sent.readFirstPage();

		// for (const blockchain of Object.keys(this.wallets)) {
		// 	for (const wallet of Object.keys(this.wallets[blockchain])) {
		// 		const sender = this.wallets[blockchain][wallet];
		// 		const account = await sender.getAuthenticatedAccount();
		// 		if (account) {
		// 			this.connectedWallets.push({
		// 				blockchain,
		// 				wallet,
		// 				account,
		// 			});
		// 		}
		// 	}
		// }
		// for (const { blockchain } of this.availableBlockchains) {
		// 	if (!this.blockchains[blockchain]) {
		// 		this.blockchains[blockchain] = await this.ylide.addBlockchain(blockchain, {
		// 			dev: false, //document.location.hostname === 'localhost',
		// 		});
		// 	}
		// }
		// this.connectedKeys = this.keystore.keys
		// 	.map(key => {
		// 		const cw = this.connectedWallets.find(
		// 			w => w.blockchain === key.blockchain && w.account.address === key.address,
		// 		);
		// 		if (!cw) {
		// 			return null;
		// 		}
		// 		return {
		// 			blockchain: key.blockchain,
		// 			address: key.address,
		// 			key: key.key,
		// 			wallet: this.wallets[cw.blockchain][cw.wallet],
		// 		};
		// 	})
		// 	.filter(t => !!t)
		// 	.map(t => t!);
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

	@computed get areThereAccounts() {
		return !!this.accounts.length;
	}

	@computed get isFirstTime() {
		return this.accounts.length === 0;
	}

	// @computed get everscaleKey() {
	// 	return domain.connectedKeys.find(t => t.blockchain === 'everscale')!;
	// }
}

//@ts-ignore
const domain = (window.domain = new Domain());
export default domain;
