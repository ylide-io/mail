import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';

import { BinanceWalletLogo } from '../icons/wallets/BinanceWalletLogo';
import { CoinbaseWalletLogo } from '../icons/wallets/CoinbaseWalletLogo';
import { EverscaleLogo } from '../icons/wallets/EverscaleLogo';
import { FrontierLogo } from '../icons/wallets/FrontierLogo';
import { MetaMaskLogo } from '../icons/wallets/MetaMaskLogo';
import { TrustWalletLogo } from '../icons/wallets/TrustWalletLogo';
import { VenomLogo } from '../icons/wallets/VenomLogo';
import { WalletConnectLogo } from '../icons/wallets/WalletConnectLogo';
import { Wallet } from '../stores/models/Wallet';
import { BlockchainName, evmNameToNetwork, isEvmBlockchain } from './blockchain';

export interface WalletMeta {
	title: string;
	link: string;
	logo: (size?: number) => JSX.Element;
	blockchains: string[];
	isProxy?: boolean;
}

export const walletsMeta: Record<string, WalletMeta> = {
	'metamask': {
		title: 'MetaMask',
		logo: (s = 30) => <MetaMaskLogo size={s} />,
		link: 'https://metamask.io/',
		blockchains: [
			EVM_NAMES[EVMNetwork.ETHEREUM],
			EVM_NAMES[EVMNetwork.BNBCHAIN],
			EVM_NAMES[EVMNetwork.POLYGON],
			EVM_NAMES[EVMNetwork.AVALANCHE],
			EVM_NAMES[EVMNetwork.OPTIMISM],
			EVM_NAMES[EVMNetwork.ARBITRUM],
			EVM_NAMES[EVMNetwork.FANTOM],
			EVM_NAMES[EVMNetwork.KLAYTN],
			EVM_NAMES[EVMNetwork.GNOSIS],
			EVM_NAMES[EVMNetwork.AURORA],
			EVM_NAMES[EVMNetwork.CELO],
			EVM_NAMES[EVMNetwork.MOONBEAM],
			EVM_NAMES[EVMNetwork.MOONRIVER],
			EVM_NAMES[EVMNetwork.METIS],
			EVM_NAMES[EVMNetwork.ASTAR],
		],
	},
	'frontier': {
		title: 'Frontier',
		logo: (s = 30) => <FrontierLogo size={s} />,
		link: 'https://www.frontier.xyz/',
		blockchains: [
			EVM_NAMES[EVMNetwork.ETHEREUM],
			EVM_NAMES[EVMNetwork.BNBCHAIN],
			EVM_NAMES[EVMNetwork.POLYGON],
			EVM_NAMES[EVMNetwork.AVALANCHE],
			EVM_NAMES[EVMNetwork.OPTIMISM],
			EVM_NAMES[EVMNetwork.ARBITRUM],
			EVM_NAMES[EVMNetwork.FANTOM],
			EVM_NAMES[EVMNetwork.KLAYTN],
			EVM_NAMES[EVMNetwork.GNOSIS],
			EVM_NAMES[EVMNetwork.AURORA],
			EVM_NAMES[EVMNetwork.CELO],
			EVM_NAMES[EVMNetwork.MOONBEAM],
			EVM_NAMES[EVMNetwork.MOONRIVER],
			EVM_NAMES[EVMNetwork.METIS],
			EVM_NAMES[EVMNetwork.ASTAR],
		],
	},
	'walletconnect': {
		title: 'WalletConnect',
		logo: (s = 30) => <WalletConnectLogo size={s} />,
		link: 'https://walletconnect.com/',
		blockchains: [
			EVM_NAMES[EVMNetwork.ETHEREUM],
			EVM_NAMES[EVMNetwork.BNBCHAIN],
			EVM_NAMES[EVMNetwork.POLYGON],
			EVM_NAMES[EVMNetwork.AVALANCHE],
			EVM_NAMES[EVMNetwork.OPTIMISM],
			EVM_NAMES[EVMNetwork.ARBITRUM],
			EVM_NAMES[EVMNetwork.FANTOM],
			EVM_NAMES[EVMNetwork.KLAYTN],
			EVM_NAMES[EVMNetwork.GNOSIS],
			EVM_NAMES[EVMNetwork.AURORA],
			EVM_NAMES[EVMNetwork.CELO],
			EVM_NAMES[EVMNetwork.MOONBEAM],
			EVM_NAMES[EVMNetwork.MOONRIVER],
			EVM_NAMES[EVMNetwork.METIS],
			EVM_NAMES[EVMNetwork.ASTAR],
		],
	},
	'coinbase': {
		title: 'Coinbase',
		logo: (s = 30) => <CoinbaseWalletLogo size={s} />,
		link: 'https://www.coinbase.com/wallet',
		blockchains: [
			EVM_NAMES[EVMNetwork.ETHEREUM],
			EVM_NAMES[EVMNetwork.BNBCHAIN],
			EVM_NAMES[EVMNetwork.POLYGON],
			EVM_NAMES[EVMNetwork.AVALANCHE],
			EVM_NAMES[EVMNetwork.OPTIMISM],
			EVM_NAMES[EVMNetwork.ARBITRUM],
			EVM_NAMES[EVMNetwork.FANTOM],
			EVM_NAMES[EVMNetwork.KLAYTN],
			EVM_NAMES[EVMNetwork.GNOSIS],
			EVM_NAMES[EVMNetwork.AURORA],
			EVM_NAMES[EVMNetwork.CELO],
			EVM_NAMES[EVMNetwork.MOONBEAM],
			EVM_NAMES[EVMNetwork.MOONRIVER],
			EVM_NAMES[EVMNetwork.METIS],
			EVM_NAMES[EVMNetwork.ASTAR],
		],
	},
	'trustwallet': {
		title: 'TrustWallet',
		logo: (s = 30) => <TrustWalletLogo size={s} />,
		link: 'https://trustwallet.com/',
		blockchains: [
			EVM_NAMES[EVMNetwork.ETHEREUM],
			EVM_NAMES[EVMNetwork.BNBCHAIN],
			EVM_NAMES[EVMNetwork.POLYGON],
			EVM_NAMES[EVMNetwork.AVALANCHE],
			EVM_NAMES[EVMNetwork.OPTIMISM],
			EVM_NAMES[EVMNetwork.ARBITRUM],
			EVM_NAMES[EVMNetwork.FANTOM],
			EVM_NAMES[EVMNetwork.KLAYTN],
			EVM_NAMES[EVMNetwork.GNOSIS],
			EVM_NAMES[EVMNetwork.AURORA],
			EVM_NAMES[EVMNetwork.CELO],
			EVM_NAMES[EVMNetwork.MOONBEAM],
			EVM_NAMES[EVMNetwork.MOONRIVER],
			EVM_NAMES[EVMNetwork.METIS],
			EVM_NAMES[EVMNetwork.ASTAR],
		],
	},
	'binance': {
		title: 'BinanceWallet',
		logo: (s = 30) => <BinanceWalletLogo size={s} />,
		link: 'https://chrome.google.com/webstore/detail/binance-wallet/fhbohimaelbohpjbbldcngcnapndodjp',
		blockchains: [
			EVM_NAMES[EVMNetwork.ETHEREUM],
			EVM_NAMES[EVMNetwork.BNBCHAIN],
			EVM_NAMES[EVMNetwork.POLYGON],
			EVM_NAMES[EVMNetwork.AVALANCHE],
			EVM_NAMES[EVMNetwork.OPTIMISM],
			EVM_NAMES[EVMNetwork.ARBITRUM],
			EVM_NAMES[EVMNetwork.FANTOM],
			EVM_NAMES[EVMNetwork.KLAYTN],
			EVM_NAMES[EVMNetwork.GNOSIS],
			EVM_NAMES[EVMNetwork.AURORA],
			EVM_NAMES[EVMNetwork.CELO],
			EVM_NAMES[EVMNetwork.MOONBEAM],
			EVM_NAMES[EVMNetwork.MOONRIVER],
			EVM_NAMES[EVMNetwork.METIS],
			EVM_NAMES[EVMNetwork.ASTAR],
		],
	},
	'everwallet': {
		title: 'EverWallet',
		logo: (s = 30) => <EverscaleLogo size={s} />,
		link: 'https://everwallet.net/',
		blockchains: ['everscale'],
	},
	'everwallet-proxy': {
		title: 'EverWallet',
		logo: (s = 30) => <EverscaleLogo size={s} />,
		link: 'https://everwallet.net/',
		blockchains: ['everscale'],
		isProxy: true,
	},
	'venomwallet': {
		title: 'Venom Wallet',
		logo: (s = 30) => <VenomLogo size={s} />,
		link: 'https://venom.foundation/wallet',
		blockchains: ['venom-testnet'],
	},
};

export function isWalletSupportsBlockchain(wallet: Wallet, chain: string) {
	return (
		(isEvmBlockchain(chain) && wallet.factory.blockchainGroup === 'evm') ||
		(chain === BlockchainName.VENOM_TESTNET && wallet.wallet === 'venomwallet') ||
		(chain === BlockchainName.EVERSCALE && wallet.factory.wallet === 'everwallet') ||
		(chain === BlockchainName.EVERSCALE && wallet.factory.wallet === 'everwallet-proxy')
	);
}

export async function getEvmWalletNetwork(wallet: Wallet): Promise<EVMNetwork | undefined> {
	try {
		if (wallet.factory.blockchainGroup === 'evm') {
			const blockchainName = await wallet.controller.getCurrentBlockchain();
			return evmNameToNetwork(blockchainName);
		}
	} catch (e) {
		console.log(`Failed to get EVM network (${wallet.wallet})`);
	}
}
