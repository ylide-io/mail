import { Uint256 } from '@ylide/sdk';

import { VENOM_FEED_ID } from '../../constants';
import { BlockchainName } from '../../utils/blockchain';
import _defaultBannerSrc from './bannerImages/_default.png';
import betFuryBannerSrc from './bannerImages/betFury.jpg';
import cryptoGvrBannerSrc from './bannerImages/cryptoGvr.jpg';
import gnosisBuildersBannerSrc from './bannerImages/gnosisBuilders.jpg';
import gravixBannerSrc from './bannerImages/gravix.jpg';
import oasisGalleryBannerSrc from './bannerImages/oasisGallery.jpg';
import oneClickCryptoBannerSrc from './bannerImages/oneClickCrypto.jpg';
import snipaBannerSrc from './bannerImages/snipa.jpg';
import staxBannerSrc from './bannerImages/stax.jpg';
import venomApeClubBannerSrc from './bannerImages/venomApeClub.jpg';
import venomBlockchainBannerSrc from './bannerImages/venomBlockchain.jpg';
import venomBridgeBannerSrc from './bannerImages/venomBridge.jpg';
import venomIdBannerSrc from './bannerImages/venomId.jpg';
import venomRecapBannerSrc from './bannerImages/venomRecap.jpg';
import ventoryBannerSrc from './bannerImages/ventory.jpg';
import web3WorldBannerSrc from './bannerImages/web3World.jpg';
import betFurySrc from './profileImages/betFury.jpg';
import cryptoGvrSrc from './profileImages/cryptoGvr.jpg';
import ethWhalesSrc from './profileImages/ethWhales.png';
import generalSrc from './profileImages/general.png';
import gnosisBuildersSrc from './profileImages/gnosisBuilders.jpg';
import gravixSrc from './profileImages/gravix.png';
import oasisGallerySrc from './profileImages/oasisGallery.png';
import oneClickCryptoSrc from './profileImages/oneClickCrypto.jpg';
import snipaSrc from './profileImages/snipa.png';
import staxSrc from './profileImages/stax.jpg';
import tvmSrc from './profileImages/tvm.png';
import venomApeClubSrc from './profileImages/venomApeClub.jpg';
import venomBlockchainSrc from './profileImages/venomBlockchain.png';
import venomBridgeSrc from './profileImages/venomBridge.png';
import venomIdSrc from './profileImages/venomId.jpg';
import venomRecapSrc from './profileImages/venomRecap.jpg';
import ventorySrc from './profileImages/ventory.png';
import web3WorldSrc from './profileImages/web3World.png';
import ylideSrc from './profileImages/ylide.png';

function inputToBlockchainProject(input: BlockchainProject | BlockchainProjectId): BlockchainProject {
	return typeof input === 'string' ? getBlockchainProjectById(input) : input;
}

export function getBlockchainProjectById(id: BlockchainProjectId) {
	return blockchainProjects.find(p => p.id === id)!;
}

export function getBlockchainProjectBannerImage(input: BlockchainProject | BlockchainProjectId) {
	return inputToBlockchainProject(input).bannerImage || _defaultBannerSrc;
}

//

export interface BlockchainProject {
	id: BlockchainProjectId;
	feedId: {
		official?: Uint256;
		discussion?: Uint256;
	};
	name: string;
	description: string;
	profileImage?: string;
	bannerImage?: string;
	website?: string;
	tags: string[];
	fixedChain?: string;
	attachmentMode?: BlockchainProjectAttachmentMode;
}

export enum BlockchainProjectId {
	// GENERAL

	GENERAL = 'general',
	ETH_WHALES = 'eth_whales',
	YLIDE = 'ylide',

	// VENOM

	OASIS_GALLERY = 'oasis_gallery',
	SNIPA = 'snipa',
	VENOM_BLOCKCHAIN = 'venom_blockchain',
	VENOM_BRIDGE = 'venom_bridge',
	WEB3_WORLD = 'web3_world',
	VENTORY = 'ventory',
	GRAVIX = 'gravix',
	STAX = 'stax',
	VENOM_ID = 'venom_id',
	VENOM_RECAP = 'venom_recap',
	VENOM_APE_CLUB = 'venom_ape_club',

	// OTHERS

	TVM = 'tvm',
	ONE_CLICK_CRYPTO = 'one_click_crypto',
	GNOSIS_BUILDERS = 'gnosis_builders',
	CRYPTO_GVR = 'crypto_gvr',
	BET_FURY = 'bet_fury',
	ISME_TEST = 'isme_test',
}

export enum BlockchainProjectAttachmentMode {
	ADMINS = 'ADMINS',
	EVERYONE = 'EVERYONE',
}

export const blockchainProjects: BlockchainProject[] = [
	// GENERAL

	{
		id: BlockchainProjectId.GENERAL,
		feedId: {
			discussion: '2000000000000000000000000000000000000000000000000000000000000003' as Uint256,
		},
		name: 'General chat',
		description: 'General chat to meet your web3 frens.',
		profileImage: generalSrc,
		tags: [],
	},
	{
		id: BlockchainProjectId.ETH_WHALES,
		feedId: {
			discussion: '2000000000000000000000000000000000000000000000000000000000000004' as Uint256,
		},
		name: 'ETH Whales',
		description: 'Here you can meet the fellow ETH supporters. Btw, messages are sent only via Ethereum chain.',
		profileImage: ethWhalesSrc,
		tags: ['Ecosystem'],
		fixedChain: BlockchainName.ETHEREUM,
		attachmentMode: BlockchainProjectAttachmentMode.EVERYONE,
	},
	{
		id: BlockchainProjectId.YLIDE,
		feedId: {
			official: '200000000000000000000000000000000000000000000000000000000000000f' as Uint256,
			discussion: '100000000000000000000000000000000000000000000000000000000000000f' as Uint256,
		},
		name: 'Ylide',
		description: 'Protocol for wallet-to-wallet communication with built-in payments.',
		profileImage: ylideSrc,
		website: 'https://ylide.io/',
		tags: ['Social', 'Venom'],
	},

	// VENOM

	{
		id: BlockchainProjectId.OASIS_GALLERY,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000006' as Uint256,
			discussion: '1000000000000000000000000000000000000000000000000000000000000006' as Uint256,
		},
		name: 'oasis.gallery',
		description: "Trade unique digital assets on Venom blockchain's NFT marketplace.",
		profileImage: oasisGallerySrc,
		bannerImage: oasisGalleryBannerSrc,
		website: 'https://oasis.gallery/',
		tags: ['NFT', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
	},
	{
		id: BlockchainProjectId.SNIPA,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000007' as Uint256,
			discussion: '1000000000000000000000000000000000000000000000000000000000000007' as Uint256,
		},
		name: 'Snipa',
		description: 'DeFi portfolio tracker designed for users to manage their assets.',
		profileImage: snipaSrc,
		bannerImage: snipaBannerSrc,
		website: 'https://snipa.finance/',
		tags: ['DeFi', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
	},
	{
		id: BlockchainProjectId.VENOM_BLOCKCHAIN,
		feedId: {
			discussion: VENOM_FEED_ID,
		},
		name: 'Venom Blockchain',
		description: 'Versatile and innovative blockchain that offers a range of use cases across various industries.',
		profileImage: venomBlockchainSrc,
		bannerImage: venomBlockchainBannerSrc,
		website: 'https://venom.foundation/',
		tags: ['Ecosystem', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
	},
	{
		id: BlockchainProjectId.VENOM_BRIDGE,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000009' as Uint256,
			discussion: '1000000000000000000000000000000000000000000000000000000000000009' as Uint256,
		},
		name: 'Venom Bridge',
		description:
			'Explore the world of interchain transactions by effortlessly transferring tokens from one chain to the other.',
		profileImage: venomBridgeSrc,
		bannerImage: venomBridgeBannerSrc,
		website: 'https://venombridge.com/',
		tags: ['DeFi', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
	},
	{
		id: BlockchainProjectId.WEB3_WORLD,
		feedId: {
			official: '200000000000000000000000000000000000000000000000000000000000000e' as Uint256,
			discussion: '100000000000000000000000000000000000000000000000000000000000000e' as Uint256,
		},
		name: 'Web3.World',
		description: 'First DEX on Venom that enables seamless trading by pooling liquidity from investors.',
		profileImage: web3WorldSrc,
		bannerImage: web3WorldBannerSrc,
		website: 'https://web3.world/',
		tags: ['DeFi', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
	},
	{
		id: BlockchainProjectId.VENTORY,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000010' as Uint256,
			discussion: '1000000000000000000000000000000000000000000000000000000000000010' as Uint256,
		},
		name: 'Ventory',
		description:
			'Multichain NFT Marketplace exclusively for entertaining games & seamless experience, initially built on Venom network.',
		profileImage: ventorySrc,
		bannerImage: ventoryBannerSrc,
		website: 'https://testnet.ventory.gg/',
		tags: ['NFT', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
	},
	{
		id: BlockchainProjectId.GRAVIX,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000011' as Uint256,
			discussion: '1000000000000000000000000000000000000000000000000000000000000011' as Uint256,
		},
		name: 'Gravix',
		description:
			'Derivatives DEX where you can trade a wide range of assets with up to 200x leverage and near-zero fees directly from your crypto wallet.',
		profileImage: gravixSrc,
		bannerImage: gravixBannerSrc,
		website: 'https://gravix.io/',
		tags: ['DeFi', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
	},
	{
		id: BlockchainProjectId.STAX,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000005' as Uint256,
			discussion: '1000000000000000000000000000000000000000000000000000000000000005' as Uint256,
		},
		name: 'Stax',
		description:
			'Stax is a unique digital platform merging art & gaming. It features 7777 unique 3D artworks & interactive games. Your NFT is a stake in Stax, with 90% profits to holders.',
		profileImage: staxSrc,
		bannerImage: staxBannerSrc,
		website: 'https://stax.live',
		tags: ['NFT', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
		attachmentMode: BlockchainProjectAttachmentMode.ADMINS,
	},
	{
		id: BlockchainProjectId.VENOM_ID,
		feedId: {
			official: '200000000000000000000000000000000000000000000000000000000000000a' as Uint256,
			discussion: '100000000000000000000000000000000000000000000000000000000000000a' as Uint256,
		},
		name: 'Venom ID',
		description:
			'Venom IDs are user-friendly solution for organizing your virtual identity in one simple link on the venom blockchain. Claim your Venom ID now!',
		profileImage: venomIdSrc,
		bannerImage: venomIdBannerSrc,
		website: 'https://venomid.network/',
		tags: ['Social', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
		attachmentMode: BlockchainProjectAttachmentMode.ADMINS,
	},
	{
		id: BlockchainProjectId.VENOM_RECAP,
		feedId: {
			official: '200000000000000000000000000000000000000000000000000000000000000b' as Uint256,
			discussion: '100000000000000000000000000000000000000000000000000000000000000b' as Uint256,
		},
		name: 'Venom Recap',
		description:
			'Discover the latest news of Venom ⚡ Supported by @sc_ventures_, and access top-tier news, insights, and knowledge on Venom.',
		profileImage: venomRecapSrc,
		bannerImage: venomRecapBannerSrc,
		website: 'https://twitter.com/VenomRecap',
		tags: ['Social', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
		attachmentMode: BlockchainProjectAttachmentMode.ADMINS,
	},
	{
		id: BlockchainProjectId.VENOM_APE_CLUB,
		feedId: {
			official: '200000000000000000000000000000000000000000000000000000000000000c' as Uint256,
			discussion: '100000000000000000000000000000000000000000000000000000000000000c' as Uint256,
		},
		name: 'Venom Ape Club',
		description: '3,333 rare, random & rad Apes living on Venom Network.',
		profileImage: venomApeClubSrc,
		bannerImage: venomApeClubBannerSrc,
		website: 'https://venomape.club/',
		tags: ['NFT', 'Venom'],
		fixedChain: BlockchainName.VENOM_TESTNET,
		attachmentMode: BlockchainProjectAttachmentMode.ADMINS,
	},

	// OTHERS

	{
		id: BlockchainProjectId.TVM,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000001' as Uint256,
			discussion: '2000000000000000000000000000000000000000000000000000000000000002' as Uint256,
		},
		name: 'TVM 주요 업데이트',
		description: '베놈과 에버스케일을 포함한 TVM 블록체인의 주요 업데이트 내용을 공유하는 채널',
		profileImage: tvmSrc,
		tags: ['TVM', 'Ecosystem', 'Venom'],
		attachmentMode: BlockchainProjectAttachmentMode.ADMINS,
	},
	{
		id: BlockchainProjectId.ONE_CLICK_CRYPTO,
		feedId: {
			official: '200000000000000000000000000000000000000000000000000000000000000d' as Uint256,
			discussion: '100000000000000000000000000000000000000000000000000000000000000d' as Uint256,
		},
		name: 'One Click Crypto',
		description: 'Diversify your portfolio, save on gas fees, and generate best risk-reward yield with One Click.',
		profileImage: oneClickCryptoSrc,
		bannerImage: oneClickCryptoBannerSrc,
		website: 'https://www.oneclick.fi/',
		tags: ['DeFi'],
		attachmentMode: BlockchainProjectAttachmentMode.ADMINS,
	},
	{
		id: BlockchainProjectId.GNOSIS_BUILDERS,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000012' as Uint256,
			discussion: '2000000000000000000000000000000000000000000000000000000000000013' as Uint256,
		},
		name: 'Gnosis Builders',
		description: 'Driving the adoption and development of the @gnosischain ecosystem🦉💚',
		profileImage: gnosisBuildersSrc,
		bannerImage: gnosisBuildersBannerSrc,
		website: 'https://www.gnosis.builders/',
		tags: ['Ecosystem', 'Social'],
		fixedChain: BlockchainName.GNOSIS,
		attachmentMode: BlockchainProjectAttachmentMode.ADMINS,
	},
	{
		id: BlockchainProjectId.CRYPTO_GVR,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000014' as Uint256,
			discussion: '2000000000000000000000000000000000000000000000000000000000000015' as Uint256,
		},
		name: 'Crypto GVR',
		description:
			'A little bit about finance, a little bit about geopolitics, not a word about race, gender. Politeness.',
		profileImage: cryptoGvrSrc,
		bannerImage: cryptoGvrBannerSrc,
		website: 'https://twitter.com/GVRCALLS',
		tags: ['Research'],
	},
	{
		id: BlockchainProjectId.BET_FURY,
		feedId: {
			official: '2000000000000000000000000000000000000000000000000000000000000016' as Uint256,
			discussion: '2000000000000000000000000000000000000000000000000000000000000017' as Uint256,
		},
		name: 'BetFury',
		description:
			'Enjoy 5000+ crypto games, fast payouts and 24/7 live support. Make the best of the superior Bitcoin Casino.',
		profileImage: betFurySrc,
		bannerImage: betFuryBannerSrc,
		website: 'https://betfury.io/',
		tags: ['Gaming'],
		attachmentMode: BlockchainProjectAttachmentMode.ADMINS,
	},
];
