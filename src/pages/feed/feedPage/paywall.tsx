import { observer } from 'mobx-react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import domain from '../../../stores/Domain';
import { connectWalletAccount, payAccount } from '../../../utils/account';

import css from './feedPage.module.scss';
import clsx from 'clsx';

const PaywallRow = ({
	title,
	subtitle,
	text,
}: {
	title: React.ReactNode;
	subtitle: React.ReactNode;
	text: React.ReactNode;
}) => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'flex-start',
				marginBottom: 40,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					marginRight: 52,
					flexBasis: 135,
					flexGrow: 0,
					flexShrink: 0,
				}}
			>
				<div
					style={{
						textAlign: 'center',
						fontSize: '40px',
						fontStyle: 'normal',
						fontWeight: '400',
						lineHeight: '22px',
						marginBottom: 10,
					}}
				>
					{title}
				</div>
				<div
					style={{
						textAlign: 'center',
						fontSize: '15px',
						fontStyle: 'normal',
						fontWeight: '300',
						lineHeight: '22px',
					}}
				>
					{subtitle}
				</div>
			</div>
			<div
				style={{
					flexGrow: 1,
					flexShrink: 1,
					fontSize: '15px',
					fontStyle: 'normal',
					fontWeight: '300',
					lineHeight: '22px',
				}}
			>
				{text}
			</div>
		</div>
	);
};

export const Paywall = observer(({ type = 'generic' }: { type?: 'generic' | 'smart-feed' }) => {
	const toPay = !!domain.account;
	return (
		<div
			className={clsx(css.paywall, type === 'generic' ? css.paywallGeneric : css.paywallSmartFeed)}
			style={{
				borderRadius: type === 'generic' ? '0px 0px 10px 10px' : 10,
				paddingTop: type === 'generic' ? 100 : 50,
				paddingBottom: 20,
				paddingLeft: 50,
				paddingRight: 50,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'flex-start',
				marginTop: type === 'generic' ? -70 : 0,
				position: 'relative',
				zIndex: 3,
			}}
		>
			<PaywallRow
				title="4,500+"
				subtitle="news sources"
				text={
					<>
						Mainview scans <b style={{ fontWeight: '700' }}>4,500+ news sources</b> in realtime: Twitter,
						Telegram, Discord, Mirror, etc.
					</>
				}
			/>
			<PaywallRow
				title="1 mln+"
				subtitle="posts processed"
				text={
					<>
						We've processed <b style={{ fontWeight: '700' }}>1 million+ posts</b> about crypto to learn how
						to personalise and prioritise news for you
					</>
				}
			/>
			<PaywallRow
				title="10,653"
				subtitle="crypto projects"
				text={
					<>
						We track <b style={{ fontWeight: '700' }}>10,000+ crypto projects</b>: from the largest to the
						smallest - we've got you covered
					</>
				}
			/>
			<div
				style={{
					textAlign: 'center',
					fontSize: '17px',
					fontStyle: 'normal',
					fontWeight: toPay ? '600' : '400',
					lineHeight: '26px',
					marginBottom: 26,
				}}
			>
				{toPay
					? `Your trial period has ended. You need to activate paid accout to keed reading Mainview.`
					: `Login to access your personal feed and get unlimited access to prebuilt feeds`}
			</div>
			<ActionButton
				size={ActionButtonSize.LARGE}
				look={ActionButtonLook.PRIMARY}
				onClick={() => (toPay ? payAccount({ place: 'paywall' }) : connectWalletAccount({ place: 'paywall' }))}
			>
				{toPay ? `Activate paid account` : `Connect wallet`}
			</ActionButton>
		</div>
	);
});
