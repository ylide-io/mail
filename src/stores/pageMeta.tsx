import { AppMode, REACT_APP__APP_MODE } from '../env';
import { createL10n, Lang } from '../utils/l10n';

export const pageMetaL10n = createL10n({
	[Lang.EN]: {
		title: {
			[AppMode.HUB]: 'Ylide Social Hub: Web3 Community Chats Powered by Ylide Protocol',
			[AppMode.OTC]: 'OTC Trading Powered by Ylide Protocol',
			[AppMode.MAIN_VIEW]: 'MainView: Your Smart News Feed',
		}[REACT_APP__APP_MODE],

		description: {
			[AppMode.HUB]:
				'Ylide Social Hub is a web3 social app powered by the Ylide protocol. Connect your digital wallet and join community spaces for diverse web3 topics. Engage in public chats, connect with web3 projects, and experience the future of decentralized communication.',
			[AppMode.OTC]: '',
			[AppMode.MAIN_VIEW]:
				'Master your crypto portfolio with our smart news feed. Follow tailored news based on your token holdings and DeFi positions. Stay focused on what matters most.',
		}[REACT_APP__APP_MODE],
	},
});
