import { Uint256 } from '@ylide/sdk';
import { ReactNode } from 'react';

import { VENOM_FEED_ID } from '../../constants';
import { ReactComponent as EthWhalesSvg } from './icons/ethWhales.svg';
import { ReactComponent as GeneralSvg } from './icons/general.svg';
import { ReactComponent as GravixSvg } from './icons/gravix.svg';
import { ReactComponent as NumiSvg } from './icons/numi.svg';
import { ReactComponent as OasisGallerySvg } from './icons/oasisGallery.svg';
import { ReactComponent as SnipaSvg } from './icons/snipa.svg';
import { ReactComponent as TvmSvg } from './icons/tvm.svg';
import { ReactComponent as TvmDiscussionSvg } from './icons/tvmDiscussion.svg';
import { ReactComponent as VenomBlockchainSvg } from './icons/venomBlockchain.svg';
import { ReactComponent as VenomBridgeSvg } from './icons/venomBridge.svg';
import { ReactComponent as VenomPadSvg } from './icons/venomPad.svg';
import { ReactComponent as VenomScanSvg } from './icons/venomScan.svg';
import { ReactComponent as VenomStakeSvg } from './icons/venomStake.svg';
import { ReactComponent as VenomWalletSvg } from './icons/venomWallet.svg';
import { ReactComponent as VentorySvg } from './icons/ventory.svg';
import { ReactComponent as Web3WorldSvg } from './icons/web3World.svg';
import { ReactComponent as YlideSvg } from './icons/ylide.svg';

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
	TVM_DISCUSSION = 'tvm_discussion',

	// tests:
	ISME_TEST = 'isme_test',
}

export interface BlockchainProjectMeta {
	id: BlockchainProjectId;
	feedId: Uint256;
	name: string;
	description: string;
	logo: ReactNode;
	website?: string;
}

export const blockchainProjectsMeta: Record<BlockchainProjectId, BlockchainProjectMeta> = {
	[BlockchainProjectId.GENERAL]: {
		id: BlockchainProjectId.GENERAL,
		feedId: '2000000000000000000000000000000000000000000000000000000000000003' as Uint256,
		name: 'General chat',
		description: 'General chat to meet your web3 frens.',
		logo: <GeneralSvg />,
	},
	[BlockchainProjectId.ETH_WHALES]: {
		id: BlockchainProjectId.ETH_WHALES,
		feedId: '2000000000000000000000000000000000000000000000000000000000000004' as Uint256,
		name: 'ETH Whales',
		description: 'Here you can meet the fellow ETH supporters. Btw, messages are sent only via Ethereum chain 😉',
		logo: <EthWhalesSvg />,
	},

	[BlockchainProjectId.NUMI]: {
		id: BlockchainProjectId.NUMI,
		feedId: '1000000000000000000000000000000000000000000000000000000000000005' as Uint256,
		name: 'Nümi',
		description:
			'Nümi is the first anime metaverse on Venom blockchain that provides players with limitless possibilities to create their own gaming experience.',
		logo: <NumiSvg />,
		website: 'https://www.numi.net/',
	},
	[BlockchainProjectId.OASIS_GALLERY]: {
		id: BlockchainProjectId.OASIS_GALLERY,
		feedId: '1000000000000000000000000000000000000000000000000000000000000006' as Uint256,
		name: 'oasis.gallery',
		description: "Trade unique digital assets on Venom blockchain's NFT marketplace.",
		logo: <OasisGallerySvg />,
		website: 'https://oasis.gallery/',
	},
	[BlockchainProjectId.SNIPA]: {
		id: BlockchainProjectId.SNIPA,
		feedId: '1000000000000000000000000000000000000000000000000000000000000007' as Uint256,
		name: 'Snipa',
		description: 'DeFi portfolio tracker designed for users to manage their assets.',
		logo: <SnipaSvg />,
		website: 'https://snipa.finance/',
	},
	[BlockchainProjectId.VENOM_BLOCKCHAIN]: {
		id: BlockchainProjectId.VENOM_BLOCKCHAIN,
		feedId: VENOM_FEED_ID,
		name: 'Venom Blockchain',
		description: 'Versatile and innovative blockchain that offers a range of use cases across various industries.',
		logo: <VenomBlockchainSvg />,
		website: 'https://venom.foundation/',
	},
	[BlockchainProjectId.VENOM_BRIDGE]: {
		id: BlockchainProjectId.VENOM_BRIDGE,
		feedId: '1000000000000000000000000000000000000000000000000000000000000009' as Uint256,
		name: 'Venom Bridge',
		description:
			'Explore the world of interchain transactions by effortlessly transferring tokens from one chain to the other.',
		logo: <VenomBridgeSvg />,
		website: 'https://venombridge.com/',
	},
	[BlockchainProjectId.VENOM_PAD]: {
		id: BlockchainProjectId.VENOM_PAD,
		feedId: '100000000000000000000000000000000000000000000000000000000000000a' as Uint256,
		name: 'VenomPad',
		description: 'First crowdfunding platform on Venom.',
		logo: <VenomPadSvg />,
		website: 'https://venompad.com/',
	},
	[BlockchainProjectId.VENOM_SCAN]: {
		id: BlockchainProjectId.VENOM_SCAN,
		feedId: '100000000000000000000000000000000000000000000000000000000000000b' as Uint256,
		name: 'Venom Scan',
		description: 'Search and explore the immutable records of the Venom blockchain.',
		logo: <VenomScanSvg />,
		website: 'https://venomscan.com/',
	},
	[BlockchainProjectId.VENOM_STAKE]: {
		id: BlockchainProjectId.VENOM_STAKE,
		feedId: '100000000000000000000000000000000000000000000000000000000000000c' as Uint256,
		name: 'VenomStake',
		description: 'Secure solution for staking VENOM tokens, enabling users to maximize rewards.',
		logo: <VenomStakeSvg />,
		website: 'https://venomstake.com/',
	},
	[BlockchainProjectId.VENOM_WALLET]: {
		id: BlockchainProjectId.VENOM_WALLET,
		feedId: '100000000000000000000000000000000000000000000000000000000000000d' as Uint256,
		name: 'Venom Wallet',
		description: 'Non-custodial wallet with a Multisig accounts option and Ledger support.',
		logo: <VenomWalletSvg />,
		website: 'https://venomwallet.com/',
	},
	[BlockchainProjectId.WEB3_WORLD]: {
		id: BlockchainProjectId.WEB3_WORLD,
		feedId: '100000000000000000000000000000000000000000000000000000000000000e' as Uint256,
		name: 'Web3.World',
		description: 'First DEX on Venom that enables seamless trading by pooling liquidity from investors.',
		logo: <Web3WorldSvg />,
		website: 'https://web3.world/',
	},
	[BlockchainProjectId.YLIDE]: {
		id: BlockchainProjectId.YLIDE,
		feedId: '100000000000000000000000000000000000000000000000000000000000000f' as Uint256,
		name: 'Ylide',
		description: 'Protocol for wallet-to-wallet communication with built-in payments.',
		logo: <YlideSvg />,
		website: 'https://ylide.io/',
	},
	[BlockchainProjectId.VENTORY]: {
		id: BlockchainProjectId.VENTORY,
		feedId: '1000000000000000000000000000000000000000000000000000000000000010' as Uint256,
		name: 'Ventory',
		description:
			'Multichain NFT Marketplace exclusively for entertaining games & seamless experience, initially built on Venom network.',
		logo: <VentorySvg />,
		website: 'https://testnet.ventory.gg/',
	},
	[BlockchainProjectId.GRAVIX]: {
		id: BlockchainProjectId.GRAVIX,
		feedId: '1000000000000000000000000000000000000000000000000000000000000011' as Uint256,
		name: 'Gravix',
		description:
			'Derivatives DEX where you can trade a wide range of assets with up to 200x leverage and near-zero fees directly from your crypto wallet.',
		logo: <GravixSvg />,
		website: 'https://gravix.io/',
	},

	[BlockchainProjectId.TVM]: {
		id: BlockchainProjectId.TVM,
		feedId: '2000000000000000000000000000000000000000000000000000000000000001' as Uint256,
		name: 'TVM 주요 업데이트',
		description: '베놈과 에버스케일을 포함한 TVM 블록체인의 주요 업데이트 내용을 공유하는 채널',
		logo: <TvmSvg />,
	},
	[BlockchainProjectId.TVM_DISCUSSION]: {
		id: BlockchainProjectId.TVM_DISCUSSION,
		feedId: '2000000000000000000000000000000000000000000000000000000000000002' as Uint256,
		name: '한마디',
		description: '누구나 자유로이 한마디',
		logo: <TvmDiscussionSvg />,
	},

	[BlockchainProjectId.ISME_TEST]: {
		id: BlockchainProjectId.ISME_TEST,
		feedId: '11d558ad3a44a6b7476209ccaecdfaf55462d9bb0edcc69c64c0f94f9b2ecc98' as Uint256,
		name: 'isme',
		description: 'ISME Test Evm',
		logo: <VentorySvg />,
		website: 'https://isme.is/',
	},
};

export const activeVenomProjects = [
	BlockchainProjectId.VENOM_BLOCKCHAIN,
	BlockchainProjectId.GRAVIX,
	BlockchainProjectId.SNIPA,
	BlockchainProjectId.WEB3_WORLD,
	BlockchainProjectId.VENOM_BRIDGE,
	BlockchainProjectId.OASIS_GALLERY,
	BlockchainProjectId.VENTORY,
	BlockchainProjectId.YLIDE,
];

export const activeTvmProjects = [BlockchainProjectId.TVM, BlockchainProjectId.TVM_DISCUSSION];
