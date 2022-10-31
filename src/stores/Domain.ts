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
	IGenericAccount,
	DynamicEncryptionRouter,
	AbstractNameService,
	IndexerListSource,
	BlockchainListSource,
	BlockchainSourceType,
} from '@ylide/sdk';
import { everscaleBlockchainFactory, everscaleWalletFactory } from '@ylide/everscale';
import { ethereumWalletFactory, evmFactories, EVMNetwork, EVM_CHAINS, EVM_NAMES } from '@ylide/ethereum';
import { makeObservable, observable } from 'mobx';
import contacts from './Contacts';
import { Wallet } from './models/Wallet';
import { Accounts } from './Accounts';
import { blockchainsMap, supportedWallets, walletsMap } from '../constants';
import SwitchModal from '../modals/SwitchModal';
import PasswordNewModal from '../modals/PasswordModalNew';
import mailList from './MailList';
import tags from './Tags';

Ylide.registerBlockchainFactory(everscaleBlockchainFactory);
// Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.LOCAL_HARDHAT]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.ETHEREUM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.AVALANCHE]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.ARBITRUM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.BNBCHAIN]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.OPTIMISM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.POLYGON]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.FANTOM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.KLAYTN]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.GNOSIS]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.AURORA]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.CELO]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.CRONOS]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.MOONBEAM]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.MOONRIVER]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.METIS]);
Ylide.registerBlockchainFactory(evmFactories[EVMNetwork.ASTAR]);
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

	@observable devMode = document.location.href.includes('localhost');

	@observable security: 'none' | 'encrypted' = 'none';

	@observable registeredBlockchains: BlockchainControllerFactory[] = [];
	@observable registeredWallets: WalletControllerFactory[] = [];

	@observable availableWallets: WalletControllerFactory[] = [];

	@observable blockchains: BlockchainMap<AbstractBlockchainController> = {};
	@observable walletControllers: BlockchainWalletMap<AbstractWalletController> = {};

	@observable wallets: Wallet[] = [];
	@observable accounts: Accounts = new Accounts(this);

	constructor() {
		makeObservable(this);

		window.addEventListener('keydown', e => {
			if (e.ctrlKey && e.key === 'KeyD') {
				this.devMode = !this.devMode;
			}
		});
	}

	getRegisteredBlockchains() {
		return Object.keys(this.blockchains).map(blockchain => ({
			blockchain,
			reader: this.blockchains[blockchain],
		}));
	}

	requestPolygonMails() {
		const reader = this.blockchains.POLYGON;
		const subject = {
			type: BlockchainSourceType.DIRECT,
			sender: null,
			recipient: this.walletControllers.evm.web3.addressToUint256(this.accounts.accounts[0].account.address),
		};
		const origSource = new BlockchainListSource(reader, subject, 10000);
		const tempSource = new IndexerListSource(origSource, mailList.readingSession.indexerHub, reader, subject);

		return { origSource, tempSource };
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

	async identifyRouteToAddresses(addresses: string[]) {
		const actualRecipients = [];
		for (const address of addresses) {
			const blockchains = this.getBlockchainsForAddress(address);
			if (blockchains.length) {
				actualRecipients.push({
					keyAddress: blockchains[0].reader.addressToUint256(address),
					keyAddressOriginal: address,
					address: blockchains[0].reader.addressToUint256(address),
				});
			}
		}
		return await DynamicEncryptionRouter.findEncyptionRoute(
			actualRecipients,
			this.getRegisteredBlockchains().map(b => b.reader),
		);
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

	async switchEVMChain(needNetwork: EVMNetwork) {
		try {
			const bData = blockchainsMap[EVM_NAMES[needNetwork]];
			// @ts-ignore
			await window.ethereum.request({
				method: 'wallet_addEthereumChain',
				params: [bData.ethNetwork!],
			});
		} catch (error) {
			console.log('error: ', error);
		}
		try {
			// @ts-ignore
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x' + Number(EVM_CHAINS[needNetwork]).toString(16) }], // chainId must be in hexadecimal numbers
			});
		} catch (err) {
			throw err;
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
							try {
								await this.switchEVMChain(needNetwork);
							} catch (err) {
								alert(
									'Wrong network (' +
										(currentNetwork ? EVM_NAMES[currentNetwork] : 'undefined') +
										'), switch to ' +
										EVM_NAMES[needNetwork],
								);
							}
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
			const controller = this.walletControllers[factory.blockchainGroup]
				? this.walletControllers[factory.blockchainGroup][factory.wallet]
				: null;
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
		await tags.getTags();
		await mailList.init();

		this.initialized = true;
	}

	// @computed get everscaleKey() {
	// 	return domain.connectedKeys.find(t => t.blockchain === 'everscale')!;
	// }
}

//@ts-ignore
const domain = (window.domain = new Domain());
export default domain;
