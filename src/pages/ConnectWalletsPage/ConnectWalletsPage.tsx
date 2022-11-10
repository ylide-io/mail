import React from 'react';
import { observer } from 'mobx-react';
import { YlideButton } from '../../controls/YlideButton';
import { ArrowRight } from '../../icons/ArrowRight';
import { useNavigate } from 'react-router-dom';

import './style.scss';
import domain from '../../stores/Domain';
import { supportedWallets } from '../../constants';
import { WalletBlock } from './WalletBlock';

const ConnectWalletsPage = observer(() => {
	const navigate = useNavigate();

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'flex-start',
				paddingTop: '5%',
				height: '100vh',
				width: '100vw',
				position: 'relative',
			}}
		>
			<div style={{ width: 350, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<h3
					style={{
						fontFamily: 'Lexend Exa',
						letterSpacing: '-0.06em',
						fontWeight: 400,
						textAlign: 'center',
						marginBottom: 30,
						fontSize: 24,
					}}
				>
					Connect your wallets
				</h3>
				<p
					style={{
						fontFamily: 'Lexend',
						fontWeight: 300,
						textAlign: 'center',
						fontSize: 16,
					}}
				>
					We found some wallets in your browser which you can use with Ylide
				</p>
				{domain.accounts.areThereAccounts ? (
					<div style={{ marginTop: 20 }}>
						<YlideButton
							onClick={() => {
								navigate(`/inbox`);
							}}
						>
							Continue with connected accounts <ArrowRight style={{ marginLeft: 10 }} />
						</YlideButton>
					</div>
				) : null}
			</div>
			<div className="wallets-block">
				{supportedWallets.map(({ blockchains, wallet }) => (
					<WalletBlock key={wallet} wallet={wallet} blockchains={blockchains} />
				))}
			</div>
		</div>
	);
});

export default ConnectWalletsPage;
