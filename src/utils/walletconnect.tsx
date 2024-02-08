import { createWeb3Modal, defaultWagmiConfig, useWeb3ModalTheme } from '@web3modal/wagmi/react';
import { PropsWithChildren, useEffect } from 'react';
import { mainnet, polygon } from 'viem/chains';
import { WagmiConfig } from 'wagmi';

// https://docs.walletconnect.com/web3modal/react/about
export function setupWeb3Modal() {
	// 1. Get projectId
	const projectId = 'eff967531d6960d4c8d1087943914f1e';

	// 2. Create wagmiConfig
	const metadata = {
		name: 'Web3Modal',
		description: 'Web3Modal Example',
		url: location.origin,
		icons: ['https://avatars.githubusercontent.com/u/37784886'],
	};

	const chains = [mainnet, polygon];
	const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

	// 3. Create modal
	createWeb3Modal({ wagmiConfig, projectId, chains });

	return wagmiConfig;
}

//

const wagmiConfig = setupWeb3Modal();

type Web3ModalManagerProps = PropsWithChildren;

export function Web3ModalManager({ children }: Web3ModalManagerProps) {
	// const { setThemeVariables } = useWeb3ModalTheme();

	// useEffect(() => {
	// 	setThemeVariables({
	// 		'--w3m-accent': '#f8cb53',
	// 	});
	// }, [setThemeVariables]);

	return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}
