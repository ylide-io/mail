import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';

import { ArbitrumLogo } from '../icons/network/ArbitrumLogo';
import { AstarLogo } from '../icons/network/AstarLogo';
import { AuroraLogo } from '../icons/network/AuroraLogo';
import { AvalancheLogo } from '../icons/network/AvalancheLogo';
import { BNBChainLogo } from '../icons/network/BNBChainLogo';
import { CeloLogo } from '../icons/network/CeloLogo';
import { CronosLogo } from '../icons/network/CronosLogo';
import { EthereumLogo } from '../icons/network/EthereumLogo';
import { EverscaleLogo } from '../icons/network/EverscaleLogo';
import { FantomLogo } from '../icons/network/FantomLogo';
import { GnosisLogo } from '../icons/network/GnosisLogo';
import { KlaytnLogo } from '../icons/network/KlaytnLogo';
import { MetisLogo } from '../icons/network/MetisLogo';
import { MoonbeamLogo } from '../icons/network/MoonbeamLogo';
import { MoonriverLogo } from '../icons/network/MoonriverLogo';
import { NearLogo } from '../icons/network/NearLogo';
import { OptimismLogo } from '../icons/network/OptimismLogo';
import { PolygonLogo } from '../icons/network/PolygonLogo';
import { SolanaLogo } from '../icons/network/SolanaLogo';
import { VenomLogo } from '../icons/network/VenomLogo';
import domain from '../stores/Domain';

export function isAddress(input: string): boolean {
	return domain.getBlockchainsForAddress(input.toLowerCase()).length > 0;
}

export function formatAddress(address: string) {
	return (
		address
			.toLowerCase()
			// 000000000000000000000000d3c2b7b1ebcd6949abcf1041cc629b2648ad2329 -> 0xd3c2b7b1ebcd6949abcf1041cc629b2648ad2329
			.replace(/^0{24}/, '0x')
			// 3f4dcce76d4760fb23879fee1a28f278b0739f99c13911094418c042fb7fbc45 -> 0:3f4dcce76d4760fb23879fee1a28f278b0739f99c13911094418c042fb7fbc45
			.replace(/^([a-f0-9]{64})$/i, '0:$1')
	);
}

//

export const BlockchainName = {
	EVERSCALE: 'everscale',
	VENOM_TESTNET: 'venom-testnet',
	SOLANA: 'solana',
	NEAR: 'near',
	LOCAL_HARDHAT: EVM_NAMES[EVMNetwork.LOCAL_HARDHAT],
	CRONOS: EVM_NAMES[EVMNetwork.CRONOS],
	ETHEREUM: EVM_NAMES[EVMNetwork.ETHEREUM],
	BNBCHAIN: EVM_NAMES[EVMNetwork.BNBCHAIN],
	ARBITRUM: EVM_NAMES[EVMNetwork.ARBITRUM],
	AVALANCHE: EVM_NAMES[EVMNetwork.AVALANCHE],
	OPTIMISM: EVM_NAMES[EVMNetwork.OPTIMISM],
	POLYGON: EVM_NAMES[EVMNetwork.POLYGON],
	FANTOM: EVM_NAMES[EVMNetwork.FANTOM],
	KLAYTN: EVM_NAMES[EVMNetwork.KLAYTN],
	GNOSIS: EVM_NAMES[EVMNetwork.GNOSIS],
	AURORA: EVM_NAMES[EVMNetwork.AURORA],
	CELO: EVM_NAMES[EVMNetwork.CELO],
	MOONBEAM: EVM_NAMES[EVMNetwork.MOONBEAM],
	MOONRIVER: EVM_NAMES[EVMNetwork.MOONRIVER],
	METIS: EVM_NAMES[EVMNetwork.METIS],
	ASTAR: EVM_NAMES[EVMNetwork.ASTAR],
};

export interface IEthereumNetworkDescriptor {
	chainId: string;
	chainName: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: 18;
	};
	rpcUrls: string[];
	blockExplorerUrls: string[];
}

export const blockchainMeta: Record<
	string,
	{
		title: string;
		logo: (s?: number) => JSX.Element;
		symbol?: string;
		ethNetwork?: IEthereumNetworkDescriptor;
	}
> = {
	[BlockchainName.EVERSCALE]: {
		title: 'Everscale',
		logo: (s = 16) => <EverscaleLogo size={s} />,
		symbol: 'EVER',
	},
	[BlockchainName.VENOM_TESTNET]: {
		title: 'Venom Testnet',
		logo: (s = 16) => <VenomLogo size={s} />,
		symbol: 'VENOM',
	},
	[BlockchainName.SOLANA]: {
		title: 'Solana',
		logo: (s = 16) => <SolanaLogo size={s} />,
	},
	[BlockchainName.NEAR]: {
		title: 'Near',
		logo: (s = 16) => <NearLogo size={30} />,
	},
	[BlockchainName.LOCAL_HARDHAT]: {
		title: 'LocalNet',
		logo: (s = 16) => <EthereumLogo size={s} />,
		ethNetwork: {
			chainId: '0x7A69',
			chainName: 'Hardhat Local',
			nativeCurrency: {
				name: 'GoEther',
				symbol: 'GO',
				decimals: 18,
			},
			rpcUrls: [],
			blockExplorerUrls: [],
		},
	},
	[BlockchainName.CRONOS]: {
		title: 'Cronos',
		logo: (s = 16) => <CronosLogo size={s} />,
		ethNetwork: {
			chainId: '0x19',
			chainName: 'Cronos Mainnet Beta',
			nativeCurrency: {
				name: 'Cronos',
				symbol: 'CRO',
				decimals: 18,
			},
			rpcUrls: [
				'https://evm.cronos.org',
				'https://cronos-rpc.heavenswail.one',
				'https://cronosrpc-1.xstaking.sg',
				'https://cronos-rpc.elk.finance',
			],
			blockExplorerUrls: ['https://cronoscan.com'],
		},
	},
	[BlockchainName.ETHEREUM]: {
		title: 'Ethereum',
		logo: (s = 16) => <EthereumLogo size={s} />,
		ethNetwork: {
			chainId: '0x1',
			chainName: 'Ethereum Mainnet',
			nativeCurrency: {
				name: 'Ether',
				symbol: 'ETH',
				decimals: 18,
			},
			rpcUrls: [
				'https://api.mycryptoapi.com/eth',
				'https://cloudflare-eth.com',
				'https://rpc.flashbots.net',
				'https://eth-mainnet.gateway.pokt.network/v1/5f3453978e354ab992c4da79',
				'https://mainnet-nethermind.blockscout.com',
				'https://nodes.mewapi.io/rpc/eth',
				'https://main-rpc.linkpool.io',
				'https://mainnet.eth.cloud.ava.do',
				'https://ethereumnodelight.app.runonflux.io',
				'https://rpc.ankr.com/eth',
				'https://eth-rpc.gateway.pokt.network',
				'https://main-light.eth.linkpool.io',
				'https://eth-mainnet.public.blastapi.io',
				'http://18.211.207.34:8545',
				'https://eth-mainnet.nodereal.io/v1/1659dfb40aa24bbb8153a677b98064d7',
				'https://api.bitstack.com/v1/wNFxbiJyQsSeLrX8RRCHi7NpRxrlErZk/DjShIqLishPCTB9HiMkPHXjUM9CNM9Na/ETH/mainnet',
				'https://eth-mainnet.unifra.io/v1/d157f0245608423091f5b4b9c8e2103e',
				'https://1rpc.io/eth',
				'https://eth-mainnet.rpcfast.com',
				'https://eth-mainnet.rpcfast.com?api_key=xbhWBI1Wkguk8SNMu1bvvLurPGLXmgwYeC4S6g2H7WdwFigZSmPWVZRxrskEQwIf',
				'https://api.securerpc.com/v1',
			],
			blockExplorerUrls: ['https://etherscan.io'],
		},
	},
	[BlockchainName.BNBCHAIN]: {
		title: 'BNB Chain',
		logo: (s = 16) => <BNBChainLogo size={s} />,
		ethNetwork: {
			chainId: '0x38',
			chainName: 'Binance Smart Chain Mainnet',
			nativeCurrency: {
				name: 'Binance Chain Native Token',
				symbol: 'BNB',
				decimals: 18,
			},
			rpcUrls: [
				'https://bsc-dataseed1.binance.org',
				'https://bsc-dataseed2.binance.org',
				'https://bsc-dataseed3.binance.org',
				'https://bsc-dataseed4.binance.org',
				'https://bsc-dataseed1.defibit.io',
				'https://bsc-dataseed2.defibit.io',
				'https://bsc-dataseed3.defibit.io',
				'https://bsc-dataseed4.defibit.io',
				'https://bsc-dataseed1.ninicoin.io',
				'https://bsc-dataseed2.ninicoin.io',
				'https://bsc-dataseed3.ninicoin.io',
				'https://bsc-dataseed4.ninicoin.io',
				'wss://bsc-ws-node.nariox.org',
				'https://bsc-dataseed.binance.org',
				'https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',
				'https://rpc.ankr.com/bsc',
				'https://bscrpc.com',
				'https://bsc.mytokenpocket.vip',
				'https://binance.nodereal.io',
				'https://rpc-bsc.bnb48.club',
				'https://bscapi.terminet.io/rpc',
				'https://1rpc.io/bnb',
				'https://bsc-mainnet.rpcfast.com',
				'https://bsc-mainnet.rpcfast.com?api_key=S3X5aFCCW9MobqVatVZX93fMtWCzff0MfRj9pvjGKSiX5Nas7hz33HwwlrT5tXRM',
			],
			blockExplorerUrls: ['https://bscscan.com'],
		},
	},
	[BlockchainName.ARBITRUM]: {
		title: 'Arbitrum',
		logo: (s = 16) => <ArbitrumLogo size={s} />,
		ethNetwork: {
			chainId: '0xa4b1',
			chainName: 'Arbitrum One',
			nativeCurrency: {
				name: 'Ether',
				symbol: 'ETH',
				decimals: 18,
			},
			rpcUrls: ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum', 'https://1rpc.io/arb'],
			blockExplorerUrls: ['https://arbiscan.io'],
		},
	},
	[BlockchainName.AVALANCHE]: {
		title: 'Avalanche',
		logo: (s = 16) => <AvalancheLogo size={s} />,
		ethNetwork: {
			chainId: '0xa86a',
			chainName: 'Avalanche C-Chain',
			nativeCurrency: {
				name: 'Avalanche',
				symbol: 'AVAX',
				decimals: 18,
			},
			rpcUrls: [
				'https://api.avax.network/ext/bc/C/rpc',
				'https://rpc.ankr.com/avalanche',
				'https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc',
				'https://avalancheapi.terminet.io/ext/bc/C/rpc',
				'https://1rpc.io/avax/c',
			],
			blockExplorerUrls: ['https://snowtrace.io'],
		},
	},
	[BlockchainName.OPTIMISM]: {
		title: 'Optimism',
		logo: (s = 16) => <OptimismLogo size={s} />,
		ethNetwork: {
			chainId: '0xa',
			chainName: 'Optimism',
			nativeCurrency: {
				name: 'Ether',
				symbol: 'ETH',
				decimals: 18,
			},
			rpcUrls: [
				'https://mainnet.optimism.io',
				'https://optimism-mainnet.public.blastapi.io',
				'https://rpc.ankr.com/optimism',
				'https://1rpc.io/op',
			],
			blockExplorerUrls: ['https://optimistic.etherscan.io'],
		},
	},
	[BlockchainName.POLYGON]: {
		title: 'Polygon',
		logo: (s = 16) => <PolygonLogo size={s} />,
		ethNetwork: {
			chainId: '0x89',
			chainName: 'Polygon Mainnet',
			nativeCurrency: {
				name: 'MATIC',
				symbol: 'MATIC',
				decimals: 18,
			},
			rpcUrls: [
				'https://polygon-rpc.com',
				'https://rpc-mainnet.matic.network',
				'https://matic-mainnet.chainstacklabs.com',
				'https://rpc-mainnet.maticvigil.com',
				'https://rpc-mainnet.matic.quiknode.pro',
				'https://matic-mainnet-full-rpc.bwarelabs.com',
				'https://matic-mainnet-archive-rpc.bwarelabs.com',
				'https://poly-rpc.gateway.pokt.network',
				'https://rpc.ankr.com/polygon',
				'https://polygon-mainnet.public.blastapi.io',
				'https://polygonapi.terminet.io/rpc',
				'https://1rpc.io/matic',
				'https://polygon-mainnet.rpcfast.com',
				'https://polygon-mainnet.rpcfast.com?api_key=eQhI7SkwYXeQJyOLWrKNvpRnW9fTNoqkX0CErPfEsZjBBtYmn2e2uLKZtQkHkZdT',
				'https://polygon-bor.publicnode.com',
				'https://matic.slingshot.finance',
			],
			blockExplorerUrls: ['https://polygonscan.com'],
		},
	},
	[BlockchainName.FANTOM]: {
		title: 'Fantom',
		logo: (s = 16) => <FantomLogo size={s} />,
		ethNetwork: {
			chainId: '0xfa',
			chainName: 'Fantom Opera',
			nativeCurrency: {
				name: 'Fantom',
				symbol: 'FTM',
				decimals: 18,
			},
			rpcUrls: [
				'https://rpc.ftm.tools',
				'https://fantom-mainnet.gateway.pokt.network/v1/lb/62759259ea1b320039c9e7ac',
				'https://rpc.ankr.com/fantom',
				'https://rpc.fantom.network',
				'https://rpc2.fantom.network',
				'https://rpc3.fantom.network',
				'https://rpcapi.fantom.network',
				'https://fantom-mainnet.public.blastapi.io',
			],
			blockExplorerUrls: ['https://ftmscan.com'],
		},
	},
	[BlockchainName.KLAYTN]: {
		title: 'Klaytn',
		logo: (s = 16) => <KlaytnLogo size={s} />,
		ethNetwork: {
			chainId: '0x2019',
			chainName: 'Klaytn Mainnet Cypress',
			nativeCurrency: {
				name: 'KLAY',
				symbol: 'KLAY',
				decimals: 18,
			},
			rpcUrls: [
				'https://public-node-api.klaytnapi.com/v1/cypress',
				'https://klaytn01.fandom.finance',
				'https://klaytn02.fandom.finance',
				'https://klaytn03.fandom.finance',
				'https://klaytn04.fandom.finance',
				'https://klaytn05.fandom.finance',
				'https://cypress.fandom.finance/archive',
			],
			blockExplorerUrls: ['https://scope.klaytn.com'],
		},
	},
	[BlockchainName.GNOSIS]: {
		title: 'Gnosis',
		logo: (s = 16) => <GnosisLogo size={s} />,
		ethNetwork: {
			chainId: '0x64',
			chainName: 'Gnosis',
			nativeCurrency: {
				name: 'xDAI',
				symbol: 'xDAI',
				decimals: 18,
			},
			rpcUrls: [
				'https://rpc.gnosischain.com',
				'https://rpc.ankr.com/gnosis',
				'https://gnosischain-rpc.gateway.pokt.network',
				'https://gnosis-mainnet.public.blastapi.io',
				'wss://rpc.gnosischain.com/wss',
				'https://xdai-rpc.gateway.pokt.network',
				'https://xdai-archive.blockscout.com',
				'https://rpc.ap-southeast-1.gateway.fm/v1/gnosis/non-archival/mainnet',
			],
			blockExplorerUrls: ['https://gnosisscan.io'],
		},
	},
	[BlockchainName.AURORA]: {
		title: 'Aurora',
		logo: (s = 16) => <AuroraLogo size={s} />,
		ethNetwork: {
			chainId: '0x4e454152',
			chainName: 'Aurora Mainnet',
			nativeCurrency: {
				name: 'Ether',
				symbol: 'ETH',
				decimals: 18,
			},
			rpcUrls: ['https://mainnet.aurora.dev'],
			blockExplorerUrls: ['https://aurorascan.dev'],
		},
	},
	[BlockchainName.CELO]: {
		title: 'Celo',
		logo: (s = 16) => <CeloLogo size={s} />,
		ethNetwork: {
			chainId: '0xa4ec',
			chainName: 'Celo Mainnet',
			nativeCurrency: {
				name: 'CELO',
				symbol: 'CELO',
				decimals: 18,
			},
			rpcUrls: ['https://forno.celo.org', 'wss://forno.celo.org/ws', 'https://rpc.ankr.com/celo'],
			blockExplorerUrls: ['https://celoscan.io'],
		},
	},
	[BlockchainName.MOONBEAM]: {
		title: 'Moonbeam',
		logo: (s = 16) => <MoonbeamLogo size={s} />,
		ethNetwork: {
			chainId: '0x504',
			chainName: 'Moonbeam',
			nativeCurrency: {
				name: 'Glimmer',
				symbol: 'GLMR',
				decimals: 18,
			},
			rpcUrls: [
				'https://rpc.api.moonbeam.network',
				'wss://wss.api.moonbeam.network',
				'https://moonbeam.public.blastapi.io',
				'https://rpc.ankr.com/moonbeam',
				'https://1rpc.io/glmr',
			],
			blockExplorerUrls: ['https://moonbeam.moonscan.io'],
		},
	},
	[BlockchainName.MOONRIVER]: {
		title: 'Moonriver',
		logo: (s = 16) => <MoonriverLogo size={s} />,
		ethNetwork: {
			chainId: '0x505',
			chainName: 'Moonriver',
			nativeCurrency: {
				name: 'Moonriver',
				symbol: 'MOVR',
				decimals: 18,
			},
			rpcUrls: [
				'https://rpc.api.moonriver.moonbeam.network',
				'wss://wss.api.moonriver.moonbeam.network',
				'https://moonriver.api.onfinality.io/rpc?apikey=673e1fae-c9c9-4c7f-a3d5-2121e8274366',
				'https://moonriver.api.onfinality.io/public',
				'https://moonriver.public.blastapi.io',
			],
			blockExplorerUrls: ['https://moonriver.moonscan.io'],
		},
	},
	[BlockchainName.METIS]: {
		title: 'Metis',
		logo: (s = 16) => <MetisLogo size={s} />,
		ethNetwork: {
			chainId: '0x440',
			chainName: 'Metis Andromeda Mainnet',
			nativeCurrency: {
				name: 'Metis',
				symbol: 'METIS',
				decimals: 18,
			},
			rpcUrls: ['https://andromeda.metis.io/?owner=1088'],
			blockExplorerUrls: ['https://andromeda-explorer.metis.io'],
		},
	},
	[BlockchainName.ASTAR]: {
		title: 'Astar',
		logo: (s = 16) => <AstarLogo size={s} />,
		ethNetwork: {
			chainId: '0x250',
			chainName: 'Astar',
			nativeCurrency: {
				name: 'Astar',
				symbol: 'ASTR',
				decimals: 18,
			},
			rpcUrls: [
				'https://rpc.astar.network:8545',
				'https://astar.public.blastapi.io',
				'https://evm.astar.network',
				'https://1rpc.io/astr',
			],
			blockExplorerUrls: ['https://astar.subscan.io'],
		},
	},
};

export function generateBlockchainExplorerUrl(blockchain: string, txId: string | undefined) {
	if (!txId) return;

	if (blockchain === 'venom-testnet') {
		return `https://testnet.venomscan.com/messages/${txId}`;
	}

	if (blockchain === 'everscale') {
		return `https://everscan.io/messages/${txId}`;
	}

	const explorerUrl = blockchainMeta[blockchain].ethNetwork?.blockExplorerUrls[0];
	return explorerUrl ? `${explorerUrl}/tx/${txId}` : undefined;
}

//

export const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map((network: EVMNetwork) => ({
	name: EVM_NAMES[network],
	network: Number(network) as EVMNetwork,
}));

export function evmNameToNetwork(name: string): EVMNetwork | undefined {
	return evmNetworks.find(n => n.name === name)?.network;
}

export function isEvmBlockchain(blockchain: string | undefined | null) {
	return !!blockchain && evmNameToNetwork(blockchain) != null;
}
