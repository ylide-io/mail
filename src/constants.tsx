import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { ArbitrumLogo } from './icons/ArbitrumLogo';
import { AvalancheLogo } from './icons/AvalancheLogo';
import { BNBChainLogo } from './icons/BNBChainLogo';
import { EthereumLogo } from './icons/EthereumLogo';
import EverscaleLogo from './icons/EverscaleLogo';
import { MetaMaskLogo } from './icons/MetaMaskLogo';
import { NearLogo } from './icons/NearLogo';
import { OptimismLogo } from './icons/OptimismLogo';
import { PhantomLogo } from './icons/PhantomLogo';
import { PolygonLogo } from './icons/PolygonLogo';
import { SolanaLogo } from './icons/SolanaLogo';
import { WalletConnectLogo } from './icons/WalletConnectLogo';

export const blockchainsMap: Record<string, { title: string; logo: (s?: number) => JSX.Element }> = {
	everscale: {
		title: 'EverScale',
		logo: (s = 16) => <EverscaleLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.ETHEREUM]]: {
		title: 'Ethereum',
		logo: (s = 16) => <EthereumLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.BNBCHAIN]]: {
		title: 'BNB Chain',
		logo: (s = 16) => <BNBChainLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.ARBITRUM]]: {
		title: 'Arbitrum',
		logo: (s = 16) => <ArbitrumLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.AVALANCHE]]: {
		title: 'Avalanche',
		logo: (s = 16) => <AvalancheLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.OPTIMISM]]: {
		title: 'Optimism',
		logo: (s = 16) => <OptimismLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.POLYGON]]: {
		title: 'Polygon',
		logo: (s = 16) => <PolygonLogo size={s} />,
	},
	solana: {
		title: 'Solana',
		logo: (s = 16) => <SolanaLogo size={s} />,
	},
	near: {
		title: 'Near',
		logo: (s = 16) => <NearLogo size={30} />,
	},
};

export const walletsMap: Record<string, { title: string; link: string; logo: JSX.Element }> = {
	web3: {
		title: 'MetaMask',
		logo: <MetaMaskLogo size={30} />,
		link: 'https://metamask.io/',
	},
	walletconnect: {
		title: 'Wallet Connect',
		logo: <WalletConnectLogo size={30} />,
		link: 'https://metamask.io/',
	},
	everwallet: {
		title: 'EverWallet',
		logo: <EverscaleLogo size={30} />,
		link: 'https://l1.broxus.com/freeton/wallet',
	},
	phantom: {
		title: 'Phantom',
		logo: <PhantomLogo size={30} />,
		link: 'https://l1.broxus.com/freeton/wallet',
	},
};

export const supportedWallets: { wallet: string; blockchains: string[] }[] = [
	{
		wallet: 'everwallet',
		blockchains: ['everscale'],
	},
	{
		wallet: 'web3',
		blockchains: [
			EVM_NAMES[EVMNetwork.ETHEREUM],
			EVM_NAMES[EVMNetwork.BNBCHAIN],
			EVM_NAMES[EVMNetwork.AVALANCHE],
			EVM_NAMES[EVMNetwork.ARBITRUM],
			EVM_NAMES[EVMNetwork.OPTIMISM],
			EVM_NAMES[EVMNetwork.POLYGON],
		],
	},
	{
		wallet: 'phantom',
		blockchains: ['solana'],
	},
];
