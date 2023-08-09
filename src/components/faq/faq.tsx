import { NarrowContent } from '../genericLayout/content/narrowContent/narrowContent';
import { GenericLayout } from '../genericLayout/genericLayout';
import css from './faq.module.scss';

export const Faq = () => {
	return (
		<GenericLayout>
			<NarrowContent contentClassName={css.root}>
				<h1>FAQ</h1>
				<h2>What is MainView?</h2>
				<p>
					MainView is a cryptocurrency news aggregation platform that simplifies content consumption for
					crypto investors, traders, asset managers, and other stakeholders by consolidating news and social
					media posts from various sources into a personalized smart feed. The feed is tailored based on
					users' wallet analytics, including token holdings, transaction history, DeFi positions, and more.
					This approach eliminates the need to track multiple platforms, enabling users to make more efficient
					investment decisions and focus on relevant information for their portfolios.
				</p>
				<h2>What is the value of MainView for me?</h2>
				<p>
					<ul>
						<li>
							1. It saves time for the target audience by streamlining content consumption from multiple
							sources.
						</li>
						<li>
							2. It enhances investment returns for users by providing personalized and pertinent
							information based on their crypto holdings and transactions.
						</li>
					</ul>
				</p>
				<h2>Who is MainView built for?</h2>
				<p>
					MainView is designed for a range of users, including:
					<ul>
						<li>1. Crypto hedge funds and professional asset managers.</li>
						<li>2. Individual traders.</li>
						<li>
							3. Market makers and trading service providers, such as custody solutions providers,
							brokers, and OTC desks.
						</li>
						<li>4. Venture capital investors and business angels.</li>
						<li>5. Retail investors.</li>
					</ul>
				</p>
				<h2>How do I access MainView?</h2>
				<p>
					Users log in using their digital wallets, ensuring privacy and convenience. MainView supports
					popular wallets like Metamask, Trust Wallet, Coinbase Wallet, and 100+ others through WalletConnect.
					MainView leverages the Ylide protocol to confirm wallet ownership.
				</p>
				<h2>What is the cost of MainView?</h2>
				<p>
					MainView is currently free to use. While we may introduce a paid subscription in the future, the
					core functionality will always remain free.
				</p>
				<h2>What is USD coverage?</h2>
				<p>
					USD coverage measures the dollar value exposure of your portfolio tracked by MainView in terms of
					news updates from projects.
				</p>
				<h2>What sources does MainView track?</h2>
				<p>
					We aggregate content from five sources: Twitter/X, Discord, Telegram, Mirror, and Medium,
					continuously expanding the list of projects covered. If we detect assets or protocol exposure in
					your wallet from projects not yet covered in our feed, we strive to promptly add them within three
					days.
				</p>
				<h2>Where can I follow MainView updates?</h2>
				<p>
					Stay updated by following us on Twitter/X:{' '}
					<a href="https://twitter.com/mainview_io" target="_blank" rel="noopener noreferrer">
						https://twitter.com/mainview_io
					</a>
				</p>
				<p>Last updated on August 9, 2023.</p>
			</NarrowContent>
		</GenericLayout>
	);
};
