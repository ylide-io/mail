import { EthereumProvider } from '@walletconnect/ethereum-provider';
import {
	EthereumWalletController,
	EVM_CHAINS,
	EVM_NAMES,
	EVM_RPCS,
	evmBlockchainFactories,
	EVMNetwork,
	evmWalletFactories,
} from '@ylide/ethereum';
import {
	everscaleBlockchainFactory,
	everscaleProxyWalletFactory,
	everscaleWalletFactory,
	venomBlockchainFactory,
	venomWalletFactory,
} from '@ylide/everscale';
import {
	AbstractBlockchainController,
	AbstractNameService,
	AbstractWalletController,
	BlockchainControllerFactory,
	BlockchainMap,
	BlockchainWalletMap,
	BrowserLocalStorage,
	DynamicEncryptionRouter,
	IGenericAccount,
	IMessage,
	WalletControllerFactory,
	Ylide,
	YlideKeyStore,
} from '@ylide/sdk';
import { makeObservable, observable } from 'mobx';
import { useMemo } from 'react';

import { NFT3NameService } from '../api/nft3DID';
import { PasswordRequestModal } from '../components/passwordRequestModal/passwordRequestModal';
import { SwitchModal, SwitchModalMode } from '../components/switchModal/switchModal';
import { AppMode, REACT_APP__APP_MODE } from '../env';
import { blockchainMeta } from '../utils/blockchain';
import { walletsMeta } from '../utils/wallet';
import { Accounts } from './Accounts';
import contacts from './Contacts';
import { EverwalletProxy } from './EverwalletProxy';
import { Wallet } from './models/Wallet';
import { OTCStore } from './OTC';
import tags from './Tags';

Ylide.verbose();

let INDEXER_BLOCKCHAINS: string[];

if (REACT_APP__APP_MODE === AppMode.OTC) {
	INDEXER_BLOCKCHAINS = ['POLYGON', 'FANTOM', 'GNOSIS'];

	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.POLYGON]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.FANTOM]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.GNOSIS]);

	Ylide.registerWalletFactory(evmWalletFactories.metamask);
	Ylide.registerWalletFactory(evmWalletFactories.frontier);
	Ylide.registerWalletFactory(evmWalletFactories.coinbase);
	Ylide.registerWalletFactory(evmWalletFactories.trustwallet);
	Ylide.registerWalletFactory(evmWalletFactories.binance);
	Ylide.registerWalletFactory(evmWalletFactories.walletconnect);
} else {
	INDEXER_BLOCKCHAINS = [
		'ETHEREUM',
		'AVALANCHE',
		'ARBITRUM',
		'BNBCHAIN',
		'OPTIMISM',
		'POLYGON',
		'FANTOM',
		'KLAYTN',
		'GNOSIS',
		'AURORA',
		'CELO',
		'CRONOS',
		'MOONBEAM',
		'MOONRIVER',
		'METIS',
	];

	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.ETHEREUM]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.AVALANCHE]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.ARBITRUM]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.BNBCHAIN]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.OPTIMISM]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.POLYGON]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.FANTOM]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.KLAYTN]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.GNOSIS]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.AURORA]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.CELO]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.CRONOS]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.MOONBEAM]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.MOONRIVER]);
	Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.METIS]);

	if (REACT_APP__APP_MODE !== AppMode.MAIN_VIEW) {
		Ylide.registerBlockchainFactory(everscaleBlockchainFactory);
		Ylide.registerWalletFactory(everscaleWalletFactory);
		Ylide.registerWalletFactory(everscaleProxyWalletFactory);

		Ylide.registerBlockchainFactory(venomBlockchainFactory);
		Ylide.registerWalletFactory(venomWalletFactory);
	}

	Ylide.registerWalletFactory(evmWalletFactories.metamask);
	Ylide.registerWalletFactory(evmWalletFactories.frontier);
	Ylide.registerWalletFactory(evmWalletFactories.coinbase);
	Ylide.registerWalletFactory(evmWalletFactories.trustwallet);
	Ylide.registerWalletFactory(evmWalletFactories.binance);
	Ylide.registerWalletFactory(evmWalletFactories.walletconnect);
}

//

export class Domain {
	savedPassword: string | null = null;

	storage = new BrowserLocalStorage();
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
	@observable enforceMainViewOnboarding: boolean = false;
	@observable publishingTxHash: string = '';

	@observable devMode = false; //document.location.href.includes('localhost');

	@observable security: 'none' | 'encrypted' = 'none';

	@observable registeredBlockchains: BlockchainControllerFactory[] = [];
	@observable registeredWallets: WalletControllerFactory[] = [];

	@observable availableWallets: WalletControllerFactory[] = [];

	@observable availableProxyAccounts: Array<{ wallet: Wallet; account: IGenericAccount }> = [];

	@observable blockchains: BlockchainMap<AbstractBlockchainController> = {};
	@observable walletControllers: BlockchainWalletMap<AbstractWalletController | null> = {};

	@observable wallets: Wallet[] = [];
	@observable accounts: Accounts = new Accounts(this);

	@observable walletConnectState:
		| { loading: true }
		| {
				loading: false;
				connected: true;
				walletName: string;
				provider: InstanceType<typeof EthereumProvider>;
		  }
		| { loading: false; connected: false; url: string } = {
		loading: true,
	};

	genericNameServices: { blockchain: string; service: AbstractNameService }[] = [
		{ blockchain: 'ETHEREUM', service: new NFT3NameService() },
	];

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

	getBlockchainsForWallet(wallet: Wallet) {
		return this.registeredBlockchains
			.filter(bc => bc.blockchainGroup === wallet.factory.blockchainGroup)
			.map(factory => ({
				factory,
				reader: this.blockchains[factory.blockchain],
			}));
	}

	getNSBlockchainsForAddress(
		name: string,
	): { blockchain: string; reader: AbstractBlockchainController; service: AbstractNameService }[] {
		const chainedNameServices = Object.keys(this.blockchains)
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
		if (chainedNameServices.length) {
			return chainedNameServices;
		}
		return this.genericNameServices
			.filter(ns => this.blockchains[ns.blockchain] && ns.service.isCandidate(name))
			.map(ns => ({
				blockchain: ns.blockchain,
				service: ns.service,
				reader: this.blockchains[ns.blockchain],
			}));
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
			const password = await PasswordRequestModal.show(reason);
			resolve(password || null);
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
		await SwitchModal.show(wallet, { mode: SwitchModalMode.SPECIFIC_ACCOUNT_REQUIRED, needAccount });
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
			const bData = blockchainMeta[EVM_NAMES[needNetwork]];
			if ('provider' in this.walletConnectState === false) {
				await (wallet.controller as EthereumWalletController).providerObject.request({
					method: 'wallet_addEthereumChain',
					params: [bData.ethNetwork!],
				});
			}
		} catch (error) {
			console.log('error: ', error);
		}
		try {
			if ('provider' in this.walletConnectState) {
				// @ts-ignore
				await domain.walletControllers.evm.walletconnect.signer.provider.send('wallet_switchEthereumChain', [
					{ chainId: '0x' + Number(EVM_CHAINS[needNetwork]).toString(16) },
				]);
			} else {
				await (wallet.controller as EthereumWalletController).providerObject.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x' + Number(EVM_CHAINS[needNetwork]).toString(16) }], // chainId must be in hexadecimal numbers
				});
			}
		} catch (err) {
			throw err;
		}
	}

	async disconnectWalletConnect() {
		if (this.walletConnectState.loading || !this.walletConnectState.connected) {
			return;
		}

		if (this.walletControllers.evm?.walletconnect) {
			await (domain.walletControllers.evm.walletconnect as any).signer.provider.provider.disconnect();
			// TODO: pizdec
			document.location.reload();
		}
	}

	async initWalletConnect() {
		if (!this.walletConnectState.loading) {
			return;
		}

		const rpcMap =
			REACT_APP__APP_MODE === AppMode.MAIN_VIEW
				? {
						// For MainView we can start with Ethereum only.
						[EVM_CHAINS[EVMNetwork.ETHEREUM]]: EVM_RPCS[EVMNetwork.ETHEREUM].find(
							r => !r.rpc.startsWith('ws'),
						)!.rpc,
				  }
				: {
						// Metamask only supports ethereum chain :(
						[EVM_CHAINS[EVMNetwork.ETHEREUM]]: EVM_RPCS[EVMNetwork.ETHEREUM].find(
							r => !r.rpc.startsWith('ws'),
						)!.rpc,
						// [EVM_CHAINS[EVMNetwork.AVALANCHE]]: EVM_RPCS[EVMNetwork.AVALANCHE].find(
						// 	r => !r.rpc.startsWith('ws'),
						// )!.rpc,
						// [EVM_CHAINS[EVMNetwork.ARBITRUM]]: EVM_RPCS[EVMNetwork.ARBITRUM].find(
						// 	r => !r.rpc.startsWith('ws'),
						// )!.rpc,
						// [EVM_CHAINS[EVMNetwork.BNBCHAIN]]: EVM_RPCS[EVMNetwork.BNBCHAIN].find(
						// 	r => !r.rpc.startsWith('ws'),
						// )!.rpc,
						// [EVM_CHAINS[EVMNetwork.OPTIMISM]]: EVM_RPCS[EVMNetwork.OPTIMISM].find(
						// 	r => !r.rpc.startsWith('ws'),
						// )!.rpc,
						// [EVM_CHAINS[EVMNetwork.POLYGON]]: EVM_RPCS[EVMNetwork.POLYGON].find(
						// 	r => !r.rpc.startsWith('ws'),
						// )!.rpc,
						// [EVM_CHAINS[EVMNetwork.FANTOM]]: EVM_RPCS[EVMNetwork.FANTOM].find(r => !r.rpc.startsWith('ws'))!
						// 	.rpc,
						// [EVM_CHAINS[EVMNetwork.AURORA]]: EVM_RPCS[EVMNetwork.AURORA].find(r => !r.rpc.startsWith('ws'))!
						// 	.rpc,
						// [EVM_CHAINS[EVMNetwork.CELO]]: EVM_RPCS[EVMNetwork.CELO].find(r => !r.rpc.startsWith('ws'))!
						// 	.rpc,
						// [EVM_CHAINS[EVMNetwork.CRONOS]]: EVM_RPCS[EVMNetwork.CRONOS].find(r => !r.rpc.startsWith('ws'))!
						// 	.rpc,

						// TODO: Chains below are not supported by TrustWallet.
						// Certain chains above are not supported by other wallets.
						// We should find out how to circumvent connection error...

						// [EVM_CHAINS[EVMNetwork.KLAYTN]]: EVM_RPCS[EVMNetwork.KLAYTN].find(r => !r.rpc.startsWith('ws'))!.rpc,
						// [EVM_CHAINS[EVMNetwork.GNOSIS]]: EVM_RPCS[EVMNetwork.GNOSIS].find(r => !r.rpc.startsWith('ws'))!.rpc,
						// [EVM_CHAINS[EVMNetwork.MOONBEAM]]: EVM_RPCS[EVMNetwork.MOONBEAM].find(r => !r.rpc.startsWith('ws'))!.rpc,
						// [EVM_CHAINS[EVMNetwork.MOONRIVER]]: EVM_RPCS[EVMNetwork.MOONRIVER].find(r => !r.rpc.startsWith('ws'))!.rpc,

						// TODO: those networks are not supported according to https://docs.walletconnect.com/2.0/advanced/multichain/chain-list

						// [EVM_CHAINS[EVMNetwork.METIS]]: EVM_RPCS[EVMNetwork.METIS].find(r => !r.rpc.startsWith('ws'))!.rpc,
						// [EVM_CHAINS[EVMNetwork.ASTAR]]: EVM_RPCS[EVMNetwork.ASTAR].find(r => !r.rpc.startsWith('ws'))!.rpc,
				  };

		const chains = Object.keys(rpcMap).map(Number);
		let isAvailable = true;
		const wcTest = await EthereumProvider.init({
			projectId: 'e9deead089b3383b2db777961e3fa244',
			chains,
			// TODO: remove after fix by WalletConnect - https://github.com/WalletConnect/walletconnect-monorepo/issues/2641
			// WalletConnect couldn't reproduce the issue, but we had it.
			// Need further to debug, but currently it does not break anything. Propose to leave it.
			optionalChains: [100500],
			rpcMap,
			showQrModal: true,
		});
		wcTest.modal?.subscribeModal(({ open }: { open: boolean }) => {
			if (open) {
				wcTest.modal?.closeModal();
				isAvailable = false;
			}
		});
		try {
			await wcTest.enable();
		} catch (err) {
			isAvailable = false;
		}

		if (isAvailable) {
			domain.walletConnectState = {
				loading: false,
				connected: true,
				walletName: wcTest.session?.peer.metadata.name || '',
				provider: wcTest,
			};
			await this.extractWalletsData();
		} else {
			const self = this;
			const wcReal = await EthereumProvider.init({
				// TODO: change to Ylide project id
				projectId: 'd6c2e9408725b77204b9e628d482e980',
				chains,
				// TODO: remove after fix by WalletConnect - https://github.com/WalletConnect/walletconnect-monorepo/issues/2641
				// WalletConnect couldn't reproduce the issue, but we had it.
				// Need further to debug, but currently it does not break anything. Propose to leave it.
				optionalChains: [100500],
				rpcMap,
				showQrModal: false,
			});
			wcReal.on('display_uri', url => {
				domain.walletConnectState = {
					loading: false,
					connected: false,
					url,
				};
			});
			wcReal.on('connect', async ({ chainId }) => {
				domain.walletConnectState = {
					loading: false,
					connected: true,
					walletName: wcReal.session?.peer.metadata.name || '',
					provider: wcReal,
				};
				await self.extractWalletsData();
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
		const somethingWentWrongTimer = setTimeout(() => {
			console.log(`Something went wrong with ${factory.wallet} wallet`);
		}, 10000);
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
				// TODO Remove after fixing 'everscaleProxyWalletFactory'
				provider: factory.wallet === 'everwallet-proxy' ? (window as any).__everProxy : undefined,
			}),
		};
		clearTimeout(somethingWentWrongTimer);
		return true;
	}

	async extractWalletsData() {
		let last = Date.now();
		const tick = (t: string) => {
			const now = Date.now();
			console.debug(t, now - last + 'ms');
			last = now;
		};

		this.registeredWallets = Ylide.walletsList.map(w => w.factory);
		this.registeredBlockchains = Ylide.blockchainsList.map(b => b.factory);

		for (const factory of this.availableWallets) {
			if (
				!this.walletControllers[factory.blockchainGroup] ||
				!this.walletControllers[factory.blockchainGroup][factory.wallet]
			) {
				console.debug('Initing wallet: ', factory.wallet);
				await this.initWallet(factory);
				tick('wallet ' + factory.wallet + ' inited');
			}
		}
		for (const factory of this.registeredBlockchains) {
			if (!this.blockchains[factory.blockchain]) {
				this.blockchains[factory.blockchain] = await this.ylide.controllers.addBlockchain(factory.blockchain, {
					dev: false, //document.location.hostname === 'localhost',
					endpoints:
						factory.blockchain === 'everscale'
							? ['https://mainnet.evercloud.dev/695e40eeac6b4e3fa4a11666f6e0d6af/graphql']
							: ['https://gql-testnet.venom.foundation/graphql'],
				});
				tick('blockchain ' + factory.blockchain + ' inited');
			}
		}

		for (const wallet in walletsMeta) {
			const factory = this.registeredWallets.find(factory => factory.wallet === wallet);
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
				tick('internal wallet ' + factory.wallet + ' inited');
				this.wallets.push(newWallet);
			}
		}

		this.availableWallets
			.filter(w => walletsMeta[w.wallet].isProxy)
			.forEach(w => {
				const wallet = this.wallets.find(it => it.wallet === w.wallet);
				const account = wallet?.currentWalletAccount;

				if (wallet && account) {
					this.availableProxyAccounts.push({ wallet, account });
				}
			});
	}

	everwalletProxy = new EverwalletProxy();

	async reloadAvailableWallets() {
		if (window.parent !== window) {
			if (await this.everwalletProxy.isProxyWalletAvailable()) {
				this.everwalletProxy.initializeEverwalletProxy();
			}
		}
		this.availableWallets = await Ylide.getAvailableWallets();
	}

	async getMessageByMsgId(msgId: string): Promise<IMessage | null> {
		for (const blockchain of Object.keys(this.blockchains)) {
			const controller = this.blockchains[blockchain];
			if (controller.isValidMsgId(msgId)) {
				try {
					return await controller.getMessageByMsgId(msgId);
				} catch (err) {
					console.error('Error getting message by msgId', err);
					return null;
				}
			}
		}
		return null;
	}

	async init() {
		if (this.initialized) {
			return;
		}
		let last = Date.now();
		const tick = (t: string) => {
			const now = Date.now();
			console.debug(t, now - last + 'ms');
			last = now;
		};
		await this.reloadAvailableWallets();
		tick('this.reloadAvailableWallets();');
		await this.initWalletConnect();
		tick('this.initWalletConnect();');
		await this.extractWalletsData();
		tick('this.extractWalletsData();');
		await this.keystore.init();
		tick('this.keystore.init();');
		await this.accounts.accountsProcessed;
		tick('this.accounts.accountsProcessed;');
		await contacts.init();
		tick('contacts.init();');
		await tags.getTags();
		tick('tags.getTags();');
		this.initialized = true;

		// hacks for VenomWallet again :(
		// let scTimes = 0;
		// const schedule = () => {
		// 	setTimeout(async () => {
		// 		await domain.reloadAvailableWallets();
		// 		await domain.extractWalletsData();
		// 		await domain.accounts.handleKeysUpdate(domain.keystore.keys);
		// 		scTimes++;
		// 		if (scTimes < 5) {
		// 			schedule();
		// 		}
		// 	}, 500);
		// };

		// schedule();
	}
}

//

export function useVenomAccounts() {
	const accounts = domain.accounts.activeAccounts;
	return useMemo(() => accounts.filter(a => a.wallet.wallet === 'venomwallet'), [accounts]);
}

export function useEvmAccounts() {
	const accounts = domain.accounts.activeAccounts;
	return useMemo(() => accounts.filter(a => a.wallet.factory.blockchainGroup === 'evm'), [accounts]);
}

//@ts-ignore
const domain = (window.domain = new Domain());
export default domain;
