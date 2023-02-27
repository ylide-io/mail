import WalletConnectProvider from '@walletconnect/web3-provider';
import {
	EthereumWalletController,
	EVM_CHAINS,
	EVM_NAMES,
	EVM_RPCS,
	evmBlockchainFactories,
	EVMNetwork,
	evmWalletFactories,
} from '@ylide/ethereum';
import { everscaleBlockchainFactory, everscaleWalletFactory } from '@ylide/everscale';
import {
	AbstractBlockchainController,
	AbstractNameService,
	AbstractWalletController,
	BlockchainControllerFactory,
	BlockchainMap,
	BlockchainWalletMap,
	BrowserIframeStorage,
	DynamicEncryptionRouter,
	IGenericAccount,
	WalletControllerFactory,
	Ylide,
	YlideKeyStore,
} from '@ylide/sdk';
import { makeObservable, observable } from 'mobx';

import { blockchainsMap, supportedWallets } from '../constants';
import PasswordModal from '../modals/PasswordModal';
import SwitchModal from '../modals/SwitchModal';
import { Accounts } from './Accounts';
import contacts from './Contacts';
import { useMailStore } from './MailList';
import { Wallet } from './models/Wallet';
import { OTCStore } from './OTC';
import tags from './Tags';

const INDEXER_BLOCKCHAINS: string[] = [
	// 'ETHEREUM',
	// 'AVALANCHE',
	// 'ARBITRUM',
	// 'BNBCHAIN',
	// 'OPTIMISM',
	// 'POLYGON',
	// 'FANTOM',
	// 'KLAYTN',
	'GNOSIS',
	// 'AURORA',
	// 'CELO',
	// 'CRONOS',
	// 'MOONBEAM',
	// 'MOONRIVER',
	// 'METIS',
];

// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.LOCAL_HARDHAT]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.ETHEREUM]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.AVALANCHE]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.ARBITRUM]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.BNBCHAIN]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.OPTIMISM]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.POLYGON]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.FANTOM]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.KLAYTN]);
Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.GNOSIS]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.AURORA]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.CELO]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.CRONOS]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.MOONBEAM]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.MOONRIVER]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.METIS]);
// Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.ASTAR]);
// Ylide.registerBlockchainFactory(everscaleBlockchainFactory);
// Ylide.registerWalletFactory(everscaleWalletFactory);
Ylide.registerWalletFactory(evmWalletFactories.metamask);
// Ylide.registerWalletFactory(evmWalletFactories.coinbase);
// Ylide.registerWalletFactory(evmWalletFactories.trustwallet);
// Ylide.registerWalletFactory(evmWalletFactories.binance);
// Ylide.registerWalletFactory(evmWalletFactories.walletconnect);

export class Domain {
	savedPassword: string | null = null;

	storage = new BrowserIframeStorage();
	keystore = new YlideKeyStore(this.storage, {
		onPasswordRequest: this.handlePasswordRequest.bind(this),
		onDeriveRequest: this.handleDeriveRequest.bind(this),
	});

	@observable initialized = false;

	ylide: Ylide = new Ylide(this.keystore, INDEXER_BLOCKCHAINS);

	@observable txChain: 'fantom' | 'gnosis' | 'polygon' = 'polygon';
	@observable txWithBonus: boolean = false;
	@observable txPlateVisible: boolean = false;
	@observable isTxPublishing: boolean = false;
	@observable publishingTxHash: string = '';

	@observable devMode = false; //document.location.href.includes('localhost');

	@observable security: 'none' | 'encrypted' = 'none';

	@observable registeredBlockchains: BlockchainControllerFactory[] = [];
	@observable registeredWallets: WalletControllerFactory[] = [];

	@observable availableWallets: WalletControllerFactory[] = [];

	@observable blockchains: BlockchainMap<AbstractBlockchainController> = {};
	@observable walletControllers: BlockchainWalletMap<AbstractWalletController | null> = {};

	@observable wallets: Wallet[] = [];
	@observable accounts: Accounts = new Accounts(this);

	@observable walletConnectState:
		| { loading: true }
		| { loading: false; connected: true; walletName: string; provider: any }
		| { loading: false; connected: false; url: string; onConnect: Promise<{ walletName: string; provider: any }> } =
		{
			loading: true,
		};

	otc = new OTCStore(this);

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

	// requestPolygonMails() {
	// 	const reader = this.blockchains.POLYGON;
	// 	const subject = {
	// 		type: BlockchainSourceType.DIRECT,
	// 		sender: null,
	// 		recipient: this.walletControllers.evm.metamask.addressToUint256(this.accounts.accounts[0].account.address),
	// 	};
	// 	const origSource = new BlockchainListSource(reader, subject, 10000);
	// 	const tempSource = new IndexerListSource(origSource, mailList.readingSession.indexerHub, reader, subject);

	// 	return { origSource, tempSource };
	// }

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
			this.ylide.core,
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
			this.ylide.core,
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
			const result = await PasswordModal.show(reason);
			resolve(result ? result.value : null);
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

	async switchEVMChain(wallet: Wallet, needNetwork: EVMNetwork) {
		try {
			const bData = blockchainsMap[EVM_NAMES[needNetwork]];

			await (wallet.controller as EthereumWalletController).providerObject.request({
				method: 'wallet_addEthereumChain',
				params: [bData.ethNetwork!],
			});
		} catch (error) {
			console.log('error: ', error);
		}
		try {
			await (wallet.controller as EthereumWalletController).providerObject.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x' + Number(EVM_CHAINS[needNetwork]).toString(16) }], // chainId must be in hexadecimal numbers
			});
		} catch (err) {
			throw err;
		}
	}

	async disconnectWalletConnect() {
		if (this.walletControllers.evm?.walletconnect) {
			await (domain.walletControllers.evm.walletconnect as any).writeWeb3.currentProvider.disconnect();
			// TODO: pizdec
			document.location.reload();
		}
	}

	async initWalletConnect() {
		if (!this.walletConnectState.loading) {
			return;
		}

		const rpcsData = {
			[EVM_CHAINS[EVMNetwork.ETHEREUM]]: EVM_RPCS[EVMNetwork.ETHEREUM].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.AVALANCHE]]: EVM_RPCS[EVMNetwork.AVALANCHE].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.ARBITRUM]]: EVM_RPCS[EVMNetwork.ARBITRUM].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.BNBCHAIN]]: EVM_RPCS[EVMNetwork.BNBCHAIN].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.OPTIMISM]]: EVM_RPCS[EVMNetwork.OPTIMISM].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.POLYGON]]: EVM_RPCS[EVMNetwork.POLYGON].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.FANTOM]]: EVM_RPCS[EVMNetwork.FANTOM].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.KLAYTN]]: EVM_RPCS[EVMNetwork.KLAYTN].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.GNOSIS]]: EVM_RPCS[EVMNetwork.GNOSIS].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.AURORA]]: EVM_RPCS[EVMNetwork.AURORA].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.CELO]]: EVM_RPCS[EVMNetwork.CELO].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.CRONOS]]: EVM_RPCS[EVMNetwork.CRONOS].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.MOONBEAM]]: EVM_RPCS[EVMNetwork.MOONBEAM].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.MOONRIVER]]: EVM_RPCS[EVMNetwork.MOONRIVER].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.METIS]]: EVM_RPCS[EVMNetwork.METIS].find(r => !r.rpc.startsWith('ws'))!.rpc,
			[EVM_CHAINS[EVMNetwork.ASTAR]]: EVM_RPCS[EVMNetwork.ASTAR].find(r => !r.rpc.startsWith('ws'))!.rpc,
		};

		let isAvailable = true;

		const wcTest = new WalletConnectProvider({
			rpc: rpcsData,
			qrcodeModal: {
				async open(uri, cb, opts?) {
					// fired this method? means disconnected
					isAvailable = false;
					cb();
				},
				close() {
					// will not be fired in test mode
				},
			},
		});

		try {
			await wcTest.enable();
		} catch (err) {
			// no-op
		}

		if (isAvailable) {
			domain.walletConnectState = {
				loading: false,
				connected: true,
				walletName: wcTest.wc.peerMeta?.name || '',
				provider: wcTest,
			};
			// console.log('wallet connect available on start: ', wcTest);
			await this.extractWalletsData();
		} else {
			let resolve = (val: { walletName: string; provider: any }) => {};
			const self = this;
			const wcReal = new WalletConnectProvider({
				rpc: rpcsData,
				qrcodeModal: {
					async open(uri, cb, opts?) {
						domain.walletConnectState = {
							loading: false,
							connected: false,
							url: uri,
							onConnect: new Promise<{ walletName: string; provider: any }>(_resolve => {
								resolve = _resolve;
							}),
						};
						// console.log('a5: ', toJS(domain.walletConnectState));
					},
					async close() {
						domain.walletConnectState = {
							loading: false,
							connected: true,
							walletName: wcReal.wc.peerMeta?.name || '',
							provider: wcReal,
						};
						// console.log('wallet connect close (good close): ', wcReal);
						await self.extractWalletsData();
						resolve({ walletName: wcReal.wc.peerMeta?.name || '', provider: wcReal });
					},
				},
			});

			wcReal
				.enable()
				.then(result => {
					// console.log('wccReal enabled: ', result);
				})
				.catch(err => {
					// console.log('wcc error: ', err);
				});
		}
	}

	async initWallet(factory: WalletControllerFactory) {
		if (factory.wallet === 'walletconnect') {
			if (this.walletConnectState.loading || !this.walletConnectState.connected) {
				return false;
			}
		}
		this.walletControllers[factory.blockchainGroup] = {
			...(this.walletControllers[factory.blockchainGroup] || {}),
			[factory.wallet]: await this.ylide.controllers.addWallet(factory.blockchainGroup, factory.wallet, {
				dev: false, //document.location.hostname === 'localhost',
				onSwitchAccountRequest: this.handleSwitchRequest.bind(this, factory.wallet),
				onNetworkSwitchRequest: async (
					reason: string,
					currentNetwork: EVMNetwork | undefined,
					needNetwork: EVMNetwork,
					needChainId: number,
				) => {
					try {
						await this.switchEVMChain(
							this.wallets.find(w => w.factory.wallet === factory.wallet)!,
							needNetwork,
						);
					} catch (err) {
						alert(
							'Wrong network (' +
								(currentNetwork ? EVM_NAMES[currentNetwork] : 'undefined') +
								'), switch to ' +
								EVM_NAMES[needNetwork],
						);
					}
				},
				walletConnectProvider:
					factory.wallet === 'walletconnect' &&
					!this.walletConnectState.loading &&
					this.walletConnectState.connected
						? this.walletConnectState.provider
						: null,
			}),
		};
		return true;
	}

	async extractWalletsData() {
		this.registeredWallets = Ylide.walletsList.map(w => w.factory);
		this.registeredBlockchains = Ylide.blockchainsList.map(b => b.factory);

		for (const factory of this.availableWallets) {
			if (
				!this.walletControllers[factory.blockchainGroup] ||
				!this.walletControllers[factory.blockchainGroup][factory.wallet]
			) {
				await this.initWallet(factory);
			}
		}
		for (const factory of this.registeredBlockchains) {
			if (!this.blockchains[factory.blockchain]) {
				this.blockchains[factory.blockchain] = await this.ylide.controllers.addBlockchain(factory.blockchain, {
					dev: false, //document.location.hostname === 'localhost',
					endpoints: ['https://mainnet.evercloud.dev/695e40eeac6b4e3fa4a11666f6e0d6af/graphql'],
				});
			}
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
			if (!this.wallets.find(w => w.factory.wallet === factory.wallet)) {
				const newWallet = new Wallet(this, factory, controller);
				await newWallet.init();
				this.wallets.push(newWallet);
			}
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
		this.availableWallets = await Ylide.getAvailableWallets();
		await this.initWalletConnect();
		await this.extractWalletsData();
		await this.keystore.init();
		await this.accounts.accountsProcessed;
		await contacts.init();
		await tags.getTags();
		await useMailStore.getState().init();
		this.initialized = true;
	}

	// @computed get everscaleKey() {
	// 	return domain.connectedKeys.find(t => t.blockchain === 'everscale')!;
	// }
}

//@ts-ignore
const domain = (window.domain = new Domain());
export default domain;
