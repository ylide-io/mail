import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { EVM_CHAINS, EVM_RPCS, EVMNetwork } from '@ylide/ethereum';
import { makeObservable, observable, transaction } from 'mobx';

import { AppMode, REACT_APP__APP_MODE } from '../env';
import domain from './Domain';

export interface IAppEntry {
	id: string;
	name: string;
	homepage: string;
	chains: string[];
	image_id: string;
	image_url: {
		sm: string;
		md: string;
		lg: string;
	};
	app: {
		browser: string;
		ios: string;
		android: string;
		mac: string;
		windows: string;
		linux: string;
	};
	mobile: {
		native: string;
		universal: string;
	};
	desktop: {
		native: string;
		universal: string;
	};
	metadata: {
		shortName: string;
		colors: {
			primary: string;
			secondary: string;
		};
	};
}

export interface IAppRegistry {
	[id: string]: IAppEntry;
}

class WalletConnectRegistry {
	@observable.ref registry: IAppRegistry = {};

	@observable loading = true;

	constructor() {
		makeObservable(this);

		this.refetch();
	}

	async refetch() {
		try {
			this.loading = true;

			const response = await fetch('https://registry.walletconnect.com/api/v2/wallets');
			const data = await response.json();

			this.registry = data.listings;
		} finally {
			this.loading = false;
		}
	}
}

export const walletConnectRegistry = new WalletConnectRegistry();

//

export class WalletConnectState {
	@observable loading = false;

	@observable.ref connection:
		| {
				readonly walletName: string;
				readonly provider: InstanceType<typeof EthereumProvider>;
		  }
		| undefined;

	@observable url = '';

	constructor() {
		makeObservable(this);
	}

	async init() {
		this.loading = true;

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
		const projectId = 'e9deead089b3383b2db777961e3fa244';
		const wcTest = await EthereumProvider.init({
			projectId,
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
			transaction(() => {
				this.loading = false;
				this.connection = {
					walletName: wcTest.session?.peer.metadata.name || '',
					provider: wcTest,
				};
			});

			await domain.extractWalletsData();
		} else {
			const wcReal = await EthereumProvider.init({
				projectId,
				chains,
				// TODO: remove after fix by WalletConnect - https://github.com/WalletConnect/walletconnect-monorepo/issues/2641
				// WalletConnect couldn't reproduce the issue, but we had it.
				// Need further to debug, but currently it does not break anything. Propose to leave it.
				optionalChains: [100500],
				rpcMap,
				showQrModal: false,
			});
			wcReal.on('display_uri', url => {
				transaction(() => {
					this.loading = false;
					this.connection = undefined;
					this.url = url;
				});
			});
			wcReal.on('connect', async ({ chainId }) => {
				transaction(() => {
					this.loading = false;
					this.connection = {
						walletName: wcReal.session?.peer.metadata.name || '',
						provider: wcReal,
					};
				});

				await domain.extractWalletsData();
			});

			wcReal.enable();
		}
	}
}
