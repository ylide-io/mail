import { Uint256 } from '@ylide/sdk';
import { ReactNode } from 'react';

import { VENOM_FEED_ID } from '../../constants';
import { ReactComponent as NumiSvg } from './icons/numi.svg';
import { ReactComponent as OasisGallerySvg } from './icons/oasisGallery.svg';
import { ReactComponent as SnipaSvg } from './icons/snipa.svg';
import { ReactComponent as VenomBlockchainSvg } from './icons/venomBlockchain.svg';
import { ReactComponent as VenomBridgeSvg } from './icons/venomBridge.svg';
import { ReactComponent as VenomPadSvg } from './icons/venomPad.svg';
import { ReactComponent as VenomScanSvg } from './icons/venomScan.svg';
import { ReactComponent as VenomStakeSvg } from './icons/venomStake.svg';
import { ReactComponent as VenomWalletSvg } from './icons/venomWallet.svg';
import { ReactComponent as Web3WorldSvg } from './icons/web3World.svg';
import { ReactComponent as YlideSvg } from './icons/ylide.svg';

export enum VenomProjectId {
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
}

export interface VenomProjectMeta {
	id: VenomProjectId;
	feedId: Uint256;
	name: string;
	description: string;
	logo: ReactNode;
}

export const venomProjectsMeta: Record<VenomProjectId, VenomProjectMeta> = {
	[VenomProjectId.NUMI]: {
		id: VenomProjectId.NUMI,
		feedId: VENOM_FEED_ID,
		name: 'Nümi',
		description:
			'Nümi is the first anime metaverse on Venom blockchain that provides players with limitless possibilities to create their own gaming experience.',
		logo: <NumiSvg />,
	},
	[VenomProjectId.OASIS_GALLERY]: {
		id: VenomProjectId.OASIS_GALLERY,
		feedId: VENOM_FEED_ID,
		name: 'oasis.gallery',
		description: "Trade unique digital assets on Venom blockchain's NFT marketplace.",
		logo: <OasisGallerySvg />,
	},
	[VenomProjectId.SNIPA]: {
		id: VenomProjectId.SNIPA,
		feedId: VENOM_FEED_ID,
		name: 'Snipa',
		description: 'DeFi portfolio tracker designed for users to manage their assets.',
		logo: <SnipaSvg />,
	},
	[VenomProjectId.VENOM_BLOCKCHAIN]: {
		id: VenomProjectId.VENOM_BLOCKCHAIN,
		feedId: VENOM_FEED_ID,
		name: 'Venom Blockchain',
		description:
			'Venom is a versatile and innovative blockchain that offers a range of use cases across various industries.',
		logo: <VenomBlockchainSvg />,
	},
	[VenomProjectId.VENOM_BRIDGE]: {
		id: VenomProjectId.VENOM_BRIDGE,
		feedId: VENOM_FEED_ID,
		name: 'Venom Bridge',
		description:
			'Explore the world of interchain transactions by effortlessly transferring tokens from one chain to the other.',
		logo: <VenomBridgeSvg />,
	},
	[VenomProjectId.VENOM_PAD]: {
		id: VenomProjectId.VENOM_PAD,
		feedId: VENOM_FEED_ID,
		name: 'VenomPad',
		description: 'First crowdfunding platform on Venom.',
		logo: <VenomPadSvg />,
	},
	[VenomProjectId.VENOM_SCAN]: {
		id: VenomProjectId.VENOM_SCAN,
		feedId: VENOM_FEED_ID,
		name: 'Venom Scan',
		description: 'Search and explore the immutable records of the Venom blockchain.',
		logo: <VenomScanSvg />,
	},
	[VenomProjectId.VENOM_STAKE]: {
		id: VenomProjectId.VENOM_STAKE,
		feedId: VENOM_FEED_ID,
		name: 'VenomStake',
		description: 'Secure solution for staking VENOM tokens, enabling users to maximize rewards.',
		logo: <VenomStakeSvg />,
	},
	[VenomProjectId.VENOM_WALLET]: {
		id: VenomProjectId.VENOM_WALLET,
		feedId: VENOM_FEED_ID,
		name: 'Venom Wallet',
		description: 'Non-custodial wallet with a Multisig accounts option and Ledger support.',
		logo: <VenomWalletSvg />,
	},
	[VenomProjectId.WEB3_WORLD]: {
		id: VenomProjectId.WEB3_WORLD,
		feedId: VENOM_FEED_ID,
		name: 'Web3.World',
		description: 'First DEX on Venom that enables seamless trading by pooling liquidity from investors.',
		logo: <Web3WorldSvg />,
	},
	[VenomProjectId.YLIDE]: {
		id: VenomProjectId.YLIDE,
		feedId: VENOM_FEED_ID,
		name: 'Ylide',
		description: 'Protocol for wallet-to-wallet communication with built-in payments.',
		logo: <YlideSvg />,
	},
};
