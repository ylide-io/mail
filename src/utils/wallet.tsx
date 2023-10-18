import { EVMNetwork } from '@ylide/ethereum';

import { BinanceWalletLogo } from '../icons/wallets/BinanceWalletLogo';
import { CoinbaseWalletLogo } from '../icons/wallets/CoinbaseWalletLogo';
import { EverscaleLogo } from '../icons/wallets/EverscaleLogo';
import { FrontierLogo } from '../icons/wallets/FrontierLogo';
import { MetaMaskLogo } from '../icons/wallets/MetaMaskLogo';
import { OkxLogo } from '../icons/wallets/OkxLogo';
import { TrustWalletLogo } from '../icons/wallets/TrustWalletLogo';
import { VenomLogo } from '../icons/wallets/VenomLogo';
import { WalletConnectLogo } from '../icons/wallets/WalletConnectLogo';
import domain from '../stores/Domain';
import { Wallet } from '../stores/models/Wallet';
import { BlockchainName, evmNameToNetwork, isEvmBlockchain } from './blockchain';

export interface WalletMeta {
	title: string;
	link: string;
	logo: (size?: number) => JSX.Element;
	isProxy?: boolean;
}

export const walletsMeta: Record<string, WalletMeta> = {
	// EVM
	'metamask': {
		title: 'MetaMask',
		logo: (s = 30) => <MetaMaskLogo size={s} />,
		link: 'https://metamask.io/',
	},
	'frontier': {
		title: 'Frontier',
		logo: (s = 30) => <FrontierLogo size={s} />,
		link: 'https://www.frontier.xyz/',
	},
	'walletconnect': {
		title: 'WalletConnect',
		logo: (s = 30) => <WalletConnectLogo size={s} />,
		link: 'https://walletconnect.com/',
	},
	'coinbase': {
		title: 'Coinbase',
		logo: (s = 30) => <CoinbaseWalletLogo size={s} />,
		link: 'https://www.coinbase.com/wallet',
	},
	'trustwallet': {
		title: 'TrustWallet',
		logo: (s = 30) => <TrustWalletLogo size={s} />,
		link: 'https://trustwallet.com/',
	},
	'binance': {
		title: 'BinanceWallet',
		logo: (s = 30) => <BinanceWalletLogo size={s} />,
		link: 'https://chrome.google.com/webstore/detail/binance-wallet/fhbohimaelbohpjbbldcngcnapndodjp',
	},

	// NON-EVM
	'everwallet': {
		title: 'EverWallet',
		logo: (s = 30) => <EverscaleLogo size={s} />,
		link: 'https://everwallet.net/',
	},
	'everwallet-proxy': {
		title: 'EverWallet',
		logo: (s = 30) => <EverscaleLogo size={s} />,
		link: 'https://everwallet.net/',
		isProxy: true,
	},
	'venomwallet': {
		title: 'Venom Wallet',
		logo: (s = 30) => <VenomLogo size={s} />,
		link: 'https://venom.foundation/wallet',
	},
	'okx': {
		title: 'OKX',
		logo: (s = 30) => <OkxLogo size={s} />,
		link: 'https://www.okx.com/web3',
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

export function getWalletSupportedBlockchains(wallet: Wallet, limitChains?: string[]): string[] {
	return domain.registeredBlockchains
		.filter(
			b =>
				isWalletSupportsBlockchain(wallet, b.blockchain) &&
				(!limitChains?.length || limitChains.includes(b.blockchain)),
		)
		.map(b => b.blockchain);
}

export async function getEvmWalletNetwork(wallet: Wallet): Promise<EVMNetwork | undefined> {
	try {
		if (wallet.factory.blockchainGroup === 'evm') {
			const blockchainName = await wallet.controller.getCurrentBlockchain();
			return evmNameToNetwork(blockchainName);
		}
	} catch (e) {
		console.error(`Failed to get EVM network (${wallet.wallet})`);
	}
}
