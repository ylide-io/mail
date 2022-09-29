import {
	Ylide,
	BlockchainMap,
	BlockchainWalletMap,
	YlideKeyStore,
	BrowserIframeStorage,
	AbstractWalletController,
	AbstractBlockchainController,
	BlockchainControllerFactory,
	WalletControllerFactory,
	MessagesList,
	BlockchainSourceSubjectType,
	IGenericAccount,
	DynamicEncryptionRouter,
	AbstractNameService,
} from '@ylide/sdk';
import { everscaleBlockchainFactory, everscaleWalletFactory } from '@ylide/everscale';
import {
	EthereumBlockchainController,
	ethereumWalletFactory,
	evmFactories,
	EVMNetwork,
	EVM_NAMES,
	EthereumBlockchainSource,
} from '@ylide/ethereum';
import { makeObservable, observable } from 'mobx';
import contacts from './Contacts';
import mailer from './Mailer';
import { DomainAccount } from './models/DomainAccount';
import { Wallet } from './models/Wallet';
import { Accounts } from './Accounts';
import { supportedWallets, walletsMap } from '../constants';
import SwitchModal from '../modals/SwitchModal';
import PasswordNewModal from '../modals/PasswordModalNew';

Ylide.registerBlockchainFactory(everscaleBlockchainFactory);
// Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.LOCAL_HARDHAT]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.ETHEREUM]);
// Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.AVALANCHE]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.ARBITRUM]);
// Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.BNBCHAIN]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.OPTIMISM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.POLYGON]);
Ylide.registerWalletFactory(everscaleWalletFactory);
Ylide.registerWalletFactory(ethereumWalletFactory);

export class Domain {
	savedPassword: string | null = null;

	storage = new BrowserIframeStorage();
	keystore = new YlideKeyStore(this.storage, {
		onPasswordRequest: this.handlePasswordRequest.bind(this),
		onDeriveRequest: this.handleDeriveRequest.bind(this),
	});

	@observable initialized = false;

	ylide: Ylide = new Ylide(this.keystore);

	@observable security: 'none' | 'encrypted' = 'none';

	@observable registeredBlockchains: BlockchainControllerFactory[] = [];
	@observable registeredWallets: WalletControllerFactory[] = [];

	@observable availableWallets: WalletControllerFactory[] = [];

	@observable blockchains: BlockchainMap<AbstractBlockchainController> = {};
	@observable walletControllers: BlockchainWalletMap<AbstractWalletController> = {};

	@observable wallets: Wallet[] = [];
	@observable accounts: Accounts = new Accounts(this);

	inbox: MessagesList;
	sent: MessagesList;

	constructor() {
		makeObservable(this);

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

	getNSBlockchainsForAddress(
		name: string,
	): { blockchain: string; reader: AbstractBlockchainController; service: AbstractNameService }[] {
		return Object.keys(this.blockchains)
			.filter(bc => {
				const service = this.blockchains[bc].defaultNameService();
				return service && service.isCandidate(name);
			})
			.map(blockchain => {
				const service = this.blockchains[blockchain].defaultNameService()!;
				return {
					blockchain,
					service,
					reader: this.blockchains[blockchain],
				};
			});
	}

	async identifyAddressAchievability(address: string) {
		const blockchains = this.getBlockchainsForAddress(address);
		if (!blockchains.length) {
			return false;
		}
		const actualRecipients = [
			{
				keyAddress: blockchains[0].reader.addressToUint256(address),
				keyAddressOriginal: address,
				address: blockchains[0].reader.addressToUint256(address),
			},
		];
		const route = await DynamicEncryptionRouter.findEncyptionRoute(
			actualRecipients,
			blockchains.map(b => b.reader),
		);
		const apprRoute = route.find(r => r.recipients.some(e => e.address === actualRecipients[0].address));
		if (!apprRoute) {
			return false;
		} else {
			return {
				type: apprRoute.type,
				blockchain:
					Object.keys(this.blockchains).find(bc => this.blockchains[bc] === apprRoute.blockchainController) ||
					null,
			};
		}
	}

	async activateAccountReading(account: DomainAccount) {
		for (const blockchain of Object.keys(this.blockchains)) {
			const reader = this.blockchains[blockchain];
			if (reader instanceof EthereumBlockchainController) {
				this.inbox.addSource(
					new EthereumBlockchainSource(
						reader,
						{
							type: BlockchainSourceSubjectType.RECIPIENT,
							address: account.uint256Address,
						},
						10000,
					),
				);
				this.sent.addSource(
					new EthereumBlockchainSource(
						reader,
						{
							type: BlockchainSourceSubjectType.RECIPIENT,
							address: Ylide.getSentAddress(account.uint256Address),
						},
						60000,
					),
				);
			} else {
				this.inbox.addReader(
					reader,
					{
						type: BlockchainSourceSubjectType.RECIPIENT,
						address: account.uint256Address,
					},
					20000,
				);
				this.sent.addReader(
					reader,
					{
						type: BlockchainSourceSubjectType.RECIPIENT,
						address: Ylide.getSentAddress(account.uint256Address),
					},
					60000,
				);
			}
		}

		if (this.accounts.accounts.length === 1) {
			try {
				this.inbox.readFirstPage();
				this.sent.readFirstPage();
			} catch (err) {
				//
			}
		}
	}

	async handlePasswordRequest(reason: string) {
		return new Promise<string | null>(async (resolve, reject) => {
			if (domain.savedPassword) {
				return resolve(domain.savedPassword);
			}
			const result = await PasswordNewModal.show(reason);
			resolve(result ? result.value : null);

			// modals.passwordModalVisible = true;
			// modals.passwordModalReason = reason;
			// modals.passwordModalHandler = resolve;
		});
	}

	async handleSwitchRequest(
		walletName: string,
		currentAccount: IGenericAccount | null,
		needAccount: IGenericAccount,
	) {
		const wallet = this.wallets.find(w => w.factory.wallet === walletName);
		if (!wallet) {
			return;
		}
		await SwitchModal.show('account', wallet, needAccount);
	}

	async handleDeriveRequest(
		reason: string,
		blockchainGroup: string,
		walletName: string,
		address: string,
		magicString: string,
	) {
		try {
			const wallet = this.wallets.find(w => w.factory.wallet === walletName);
			if (!wallet) {
				return null;
			}
			return wallet.controller.signMagicString(
				{
					address,
					blockchain: blockchainGroup,
					publicKey: null,
				},
				magicString,
			);
		} catch (err) {
			return null;
		}
	}

	async extractWalletsData() {
		this.registeredWallets = Ylide.walletsList.map(w => w.factory);
		this.registeredBlockchains = Ylide.blockchainsList.map(b => b.factory);

		this.availableWallets = await Ylide.getAvailableWallets();

		for (const factory of this.availableWallets) {
			if (
				!this.walletControllers[factory.blockchainGroup] ||
				!this.walletControllers[factory.blockchainGroup][factory.wallet]
			) {
				this.walletControllers[factory.blockchainGroup] = {
					...(this.walletControllers[factory.blockchainGroup] || {}),
					[factory.wallet]: await this.ylide.addWallet(factory.blockchainGroup, factory.wallet, {
						dev: false, //document.location.hostname === 'localhost',
						onSwitchAccountRequest: this.handleSwitchRequest.bind(this, factory.wallet),
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
				endpoints: ['https://mainnet.evercloud.dev/695e40eeac6b4e3fa4a11666f6e0d6af/graphql'],
			});
		}

		for (const supportedWallet of supportedWallets) {
			const factory = this.registeredWallets.find(factory => factory.wallet === supportedWallet.wallet);
			if (!factory) {
				continue;
			}
			const controller = this.walletControllers[factory.blockchainGroup][factory.wallet];
			if (!controller) {
				continue;
			}
			const newWallet = new Wallet(this, factory.wallet, factory, controller, walletsMap[factory.wallet].link);
			await newWallet.init();
			this.wallets.push(newWallet);
		}

		// for (const blockchain of Object.keys(this.walletControllers)) {
		// 	for (const wallet of Object.keys(this.walletControllers[blockchain])) {
		// 		const sender = this.walletControllers[blockchain][wallet];
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
		// 			wallet: this.walletControllers[cw.blockchain][cw.wallet],
		// 		};
		// 	})
		// 	.filter(t => !!t)
		// 	.map(t => t!);
	}

	async init() {
		if (this.initialized) {
			return;
		}

		await this.extractWalletsData();

		await this.keystore.init();

		await this.accounts.accountsProcessed;

		await contacts.init();
		await mailer.init();

		this.inbox.readFirstPage();
		this.sent.readFirstPage();

		this.initialized = true;
	}

	// @computed get everscaleKey() {
	// 	return domain.connectedKeys.find(t => t.blockchain === 'everscale')!;
	// }
}

//@ts-ignore
const domain = (window.domain = new Domain());
export default domain;
