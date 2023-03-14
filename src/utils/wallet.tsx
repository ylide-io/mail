import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';

import { BinanceWalletLogo } from '../icons/BinanceWalletLogo';
import { CoinbaseWalletLogo } from '../icons/CoinbaseWalletLogo';
import EverscaleLogo from '../icons/EverscaleLogo';
import { MetaMaskLogo } from '../icons/MetaMaskLogo';
import { PhantomLogo } from '../icons/PhantomLogo';
import { TrustWalletLogo } from '../icons/TrustWalletLogo';
import VenomLogo from '../icons/VenomLogo';
import { WalletConnectLogo } from '../icons/WalletConnectLogo';
import { Wallet } from '../stores/models/Wallet';
import { invariant } from './assert';
import { evmNameToNetwork } from './blockchain';

export interface WalletMeta {
	title: string;
	link: string;
	logo: (size?: number) => JSX.Element;
}

export const walletsMeta: Record<string, WalletMeta> = {
	metamask: {
		title: 'MetaMask',
		logo: (s = 30) => <MetaMaskLogo size={s} />,
		link: 'https://metamask.io/',
	},
	walletconnect: {
		title: 'WalletConnect',
		logo: (s = 30) => <WalletConnectLogo size={s} />,
		link: 'https://walletconnect.com/',
	},
	coinbase: {
		title: 'Coinbase',
		logo: (s = 30) => <CoinbaseWalletLogo size={s} />,
		link: 'https://www.coinbase.com/wallet',
	},
	trustwallet: {
		title: 'TrustWallet',
		logo: (s = 30) => <TrustWalletLogo size={s} />,
		link: 'https://trustwallet.com/',
	},
	binance: {
		title: 'BinanceWallet',
		logo: (s = 30) => <BinanceWalletLogo size={s} />,
		link: 'https://chrome.google.com/webstore/detail/binance-wallet/fhbohimaelbohpjbbldcngcnapndodjp',
	},
	everwallet: {
		title: 'EverWallet',
		logo: (s = 30) => <EverscaleLogo size={s} />,
		link: 'https://everwallet.net/',
	},
	venomwallet: {
		title: 'Venom Wallet',
		logo: (s = 30) => <VenomLogo size={s} />,
		link: 'https://venom.foundation/wallet',
	},
	phantom: {
		title: 'Phantom',
		logo: (s = 30) => <PhantomLogo size={s} />,
		link: 'https://l1.broxus.com/freeton/wallet',
	},
};

export const supportedWallets: { wallet: string; blockchains: string[] }[] = [
	{
		wallet: 'metamask',
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
	{
		wallet: 'walletconnect',
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
	{
		wallet: 'coinbase',
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
	{
		wallet: 'trustwallet',
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
	{
		wallet: 'binance',
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
	{
		wallet: 'everwallet',
		blockchains: ['everscale'],
	},
	{
		wallet: 'venomwallet',
		blockchains: ['venom-testnet'],
	},
];

export async function getEvmWalletNetwork(wallet: Wallet) {
	invariant(wallet.factory.blockchainGroup === 'evm', 'Not an EVM wallet');

	const blockchainName = await wallet.controller.getCurrentBlockchain();
	return evmNameToNetwork(blockchainName);
}
