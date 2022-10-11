import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { ArbitrumLogo } from './icons/ArbitrumLogo';
import { AstarLogo } from './icons/AstarLogo';
import { AuroraLogo } from './icons/AuroraLogo';
import { AvalancheLogo } from './icons/AvalancheLogo';
import { BNBChainLogo } from './icons/BNBChainLogo';
import { CeloLogo } from './icons/CeloLogo';
import { EthereumLogo } from './icons/EthereumLogo';
import EverscaleLogo from './icons/EverscaleLogo';
import { FantomLogo } from './icons/FantomLogo';
import { GnosisLogo } from './icons/GnosisLogo';
import { KlaytnLogo } from './icons/KlaytnLogo';
import { MetaMaskLogo } from './icons/MetaMaskLogo';
import { MetisLogo } from './icons/MetisLogo';
import { MoonbeamLogo } from './icons/MoonbeamLogo';
import { MoonriverLogo } from './icons/MoonriverLogo';
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
	[EVM_NAMES[EVMNetwork.FANTOM]]: {
		title: 'Fantom',
		logo: (s = 16) => <FantomLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.KLAYTN]]: {
		title: 'Klaytn',
		logo: (s = 16) => <KlaytnLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.GNOSIS]]: {
		title: 'Gnosis',
		logo: (s = 16) => <GnosisLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.AURORA]]: {
		title: 'Aurora',
		logo: (s = 16) => <AuroraLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.CELO]]: {
		title: 'Celo',
		logo: (s = 16) => <CeloLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.MOONBEAM]]: {
		title: 'Moonbeam',
		logo: (s = 16) => <MoonbeamLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.MOONRIVER]]: {
		title: 'Moonriver',
		logo: (s = 16) => <MoonriverLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.METIS]]: {
		title: 'Metis',
		logo: (s = 16) => <MetisLogo size={s} />,
	},
	[EVM_NAMES[EVMNetwork.ASTAR]]: {
		title: 'Astar',
		logo: (s = 16) => <AstarLogo size={s} />,
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
