import { observer } from 'mobx-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supportedWallets } from '../../constants';
import { YlideButton } from '../../controls/YlideButton';
import { ArrowRight } from '../../icons/ArrowRight';
import SelectWalletModal from '../../modals/SelectWalletModal';
import domain from '../../stores/Domain';
import walletConnect from '../../stores/WalletConnect';
import { WalletBlock } from './WalletBlock';

const ConnectWalletsPage = observer(() => {
	const navigate = useNavigate();

	useEffect(() => {
		walletConnect.load();
	}, []);

	return (
		<div className="intro-page">
			<div className="intro-inner-block">
				<h3 className="intro-title">
					Connect your wallets{' '}
					<a
						href="#test"
						onClick={e => {
							e.preventDefault();
							SelectWalletModal.show();
						}}
					>
						test
					</a>
				</h3>
				<p className="intro-subtitle">We found some wallets in your browser which you can use with Ylide</p>
				{domain.accounts.areThereAccounts ? (
					<div className="intro-buttons">
						<YlideButton
							onClick={() => {
								navigate(`/mail/inbox`);
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
