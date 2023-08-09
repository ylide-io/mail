import { Uint256 } from '@ylide/sdk';

import { VENOM_FEED_ID } from '../../constants';
import ethWhalesSrc from './profilePictures/ethWhales.png';
import generalSrc from './profilePictures/general.png';
import gravixSrc from './profilePictures/gravix.png';
import oasisGallerySrc from './profilePictures/oasisGallery.png';
import snipaSrc from './profilePictures/snipa.png';
import tvmSrc from './profilePictures/tvm.png';
import venomBlockchainSrc from './profilePictures/venomBlockchain.png';
import venomBridgeSrc from './profilePictures/venomBridge.png';
import ventorySrc from './profilePictures/ventory.png';
import web3WorldSrc from './profilePictures/web3World.png';
import ylideSrc from './profilePictures/ylide.png';

export enum BlockchainProjectId {
	GENERAL = 'general',
	ETH_WHALES = 'eth_whales',

	NUMI = 'numi',
	OASIS_GALLERY = 'oasis_gallery',
	SNIPA = 'snipa',
	VENOM_BLOCKCHAIN = 'venom_blockchain',
	VENOM_BRIDGE = 'venom_bridge',
	VENOM_PAD = 'venom_pad',
	VENOM_SCAN = 'venom_scan',
	VENOM_STAKE = 'venom_stake',
	VENOM_WALLET = 'venom_wallet',
	WEB3_WORLD = 'web3_world',
	YLIDE = 'ylide',
	VENTORY = 'ventory',
	GRAVIX = 'gravix',

	TVM = 'tvm',

	// TESTS

	ISME_TEST = 'isme_test',
}

export interface BlockchainProject {
	id: BlockchainProjectId;
	feedId: {
		official?: Uint256;
		discussion?: Uint256;
	};
	name: string;
	description: string;
	profilePicture?: string;
	banner?: string;
	website?: string;
	tags: string[];
	onlyVenom?: boolean;
	onlyEtherium?: boolean;
}

export const blockchainProjects: Record<BlockchainProjectId, BlockchainProject> = {
	[BlockchainProjectId.GENERAL]: {
		id: BlockchainProjectId.GENERAL,
		feedId: {
			discussion: '2000000000000000000000000000000000000000000000000000000000000003' as Uint256,
		},
		name: 'General chat',
		description: 'General chat to meet your web3 frens.',
		profilePicture: generalSrc,
		tags: [],
	},
	[BlockchainProjectId.ETH_WHALES]: {
		id: BlockchainProjectId.ETH_WHALES,
		feedId: {
			discussion: '2000000000000000000000000000000000000000000000000000000000000004' as Uint256,
		},
		name: 'ETH Whales',
		description: 'Here you can meet the fellow ETH supporters. Btw, messages are sent only via Ethereum chain.',
		profilePicture: ethWhalesSrc,
		banner: 'https://picsum.photos/id/723/1500/500',
		tags: ['Blockchain', 'Ethereum'],
		onlyEtherium: true,
	},
	[BlockchainProjectId.YLIDE]: {
		id: BlockchainProjectId.YLIDE,
		feedId: {
			discussion: '100000000000000000000000000000000000000000000000000000000000000f' as Uint256,
		},
		name: 'Ylide',
		description: 'Protocol for wallet-to-wallet communication with built-in payments.',
		profilePicture: ylideSrc,
		website: 'https://ylide.io/',
		tags: ['Blockchain', 'Ylide'],
	},

	[BlockchainProjectId.NUMI]: {
		id: BlockchainProjectId.NUMI,
		feedId: {
			discussion: '1000000000000000000000000000000000000000000000000000000000000005' as Uint256,
		},
		name: 'Nümi',
		description:
			'Nümi is the first anime metaverse on Venom blockchain that provides players with limitless possibilities to create their own gaming experience.',
		website: 'https://www.numi.net/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.OASIS_GALLERY]: {
		id: BlockchainProjectId.OASIS_GALLERY,
		feedId: {
			discussion: '1000000000000000000000000000000000000000000000000000000000000006' as Uint256,
		},
		name: 'oasis.gallery',
		description: "Trade unique digital assets on Venom blockchain's NFT marketplace.",
		profilePicture: oasisGallerySrc,
		website: 'https://oasis.gallery/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.SNIPA]: {
		id: BlockchainProjectId.SNIPA,
		feedId: {
			discussion: '1000000000000000000000000000000000000000000000000000000000000007' as Uint256,
		},
		name: 'Snipa',
		description: 'DeFi portfolio tracker designed for users to manage their assets.',
		profilePicture: snipaSrc,
		website: 'https://snipa.finance/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.VENOM_BLOCKCHAIN]: {
		id: BlockchainProjectId.VENOM_BLOCKCHAIN,
		feedId: {
			discussion: VENOM_FEED_ID,
		},
		name: 'Venom Blockchain',
		description: 'Versatile and innovative blockchain that offers a range of use cases across various industries.',
		profilePicture: venomBlockchainSrc,
		banner: 'https://picsum.photos/id/1005/1500/500',
		website: 'https://venom.foundation/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.VENOM_BRIDGE]: {
		id: BlockchainProjectId.VENOM_BRIDGE,
		feedId: {
			discussion: '1000000000000000000000000000000000000000000000000000000000000009' as Uint256,
		},
		name: 'Venom Bridge',
		description:
			'Explore the world of interchain transactions by effortlessly transferring tokens from one chain to the other.',
		profilePicture: venomBridgeSrc,
		website: 'https://venombridge.com/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.VENOM_PAD]: {
		id: BlockchainProjectId.VENOM_PAD,
		feedId: {
			discussion: '100000000000000000000000000000000000000000000000000000000000000a' as Uint256,
		},
		name: 'VenomPad',
		description: 'First crowdfunding platform on Venom.',
		website: 'https://venompad.com/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.VENOM_SCAN]: {
		id: BlockchainProjectId.VENOM_SCAN,
		feedId: {
			discussion: '100000000000000000000000000000000000000000000000000000000000000b' as Uint256,
		},
		name: 'Venom Scan',
		description: 'Search and explore the immutable records of the Venom blockchain.',
		website: 'https://venomscan.com/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.VENOM_STAKE]: {
		id: BlockchainProjectId.VENOM_STAKE,
		feedId: {
			discussion: '100000000000000000000000000000000000000000000000000000000000000c' as Uint256,
		},
		name: 'VenomStake',
		description: 'Secure solution for staking VENOM tokens, enabling users to maximize rewards.',
		website: 'https://venomstake.com/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.VENOM_WALLET]: {
		id: BlockchainProjectId.VENOM_WALLET,
		feedId: {
			discussion: '100000000000000000000000000000000000000000000000000000000000000d' as Uint256,
		},
		name: 'Venom Wallet',
		description: 'Non-custodial wallet with a Multisig accounts option and Ledger support.',
		website: 'https://venomwallet.com/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.WEB3_WORLD]: {
		id: BlockchainProjectId.WEB3_WORLD,
		feedId: {
			discussion: '100000000000000000000000000000000000000000000000000000000000000e' as Uint256,
		},
		name: 'Web3.World',
		description: 'First DEX on Venom that enables seamless trading by pooling liquidity from investors.',
		profilePicture: web3WorldSrc,
		website: 'https://web3.world/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.VENTORY]: {
		id: BlockchainProjectId.VENTORY,
		feedId: {
			discussion: '1000000000000000000000000000000000000000000000000000000000000010' as Uint256,
		},
		name: 'Ventory',
		description:
			'Multichain NFT Marketplace exclusively for entertaining games & seamless experience, initially built on Venom network.',
		profilePicture: ventorySrc,
		website: 'https://testnet.ventory.gg/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},
	[BlockchainProjectId.GRAVIX]: {
		id: BlockchainProjectId.GRAVIX,
		feedId: {
			discussion: '1000000000000000000000000000000000000000000000000000000000000011' as Uint256,
		},
		name: 'Gravix',
		description:
			'Derivatives DEX where you can trade a wide range of assets with up to 200x leverage and near-zero fees directly from your crypto wallet.',
		profilePicture: gravixSrc,
		banner: 'https://picsum.photos/id/379/1500/500',
		website: 'https://gravix.io/',
		tags: ['Blockchain', 'Venom'],
		onlyVenom: true,
	},

	[BlockchainProjectId.TVM]: {
		id: BlockchainProjectId.TVM,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000001' as Uint256,
			discussion: '2000000000000000000000000000000000000000000000000000000000000002' as Uint256,
		},
		name: 'TVM 주요 업데이트',
		description: '베놈과 에버스케일을 포함한 TVM 블록체인의 주요 업데이트 내용을 공유하는 채널',
		profilePicture: tvmSrc,
		banner: 'https://picsum.photos/id/356/1500/500',
		tags: ['Blockchain', 'TVM'],
	},

	[BlockchainProjectId.ISME_TEST]: {
		id: BlockchainProjectId.ISME_TEST,
		feedId: {
			discussion: '11d558ad3a44a6b7476209ccaecdfaf55462d9bb0edcc69c64c0f94f9b2ecc98' as Uint256,
		},
		name: 'isme',
		description: 'ISME Test Evm',
		website: 'https://isme.is/',
		tags: ['Blockchain', 'is.me'],
	},
};
