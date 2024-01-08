import { useState } from 'react';
import {
	AuthorizeAccountFlow,
	BuildFeedFlow,
	MainViewOnboarding,
} from '../components/mainViewOnboarding/mainViewOnboarding';
import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import { analytics } from '../stores/Analytics';
import { browserStorage } from '../stores/browserStorage';
import domain from '../stores/Domain';
import { DomainAccount } from '../stores/models/DomainAccount';
import { truncateInMiddle } from './string';

import { ActionButton, ActionButtonSize, ActionButtonLook } from '../components/ActionButton/ActionButton';
import { ActionModal } from '../components/actionModal/actionModal';

export function formatAccountName(account: DomainAccount) {
	return truncateInMiddle(account.address, 8, '..');
}

export async function connectMainviewAccount(params?: { noCloseButton?: boolean; place?: string }) {
	return await showStaticComponent<DomainAccount | undefined>(resolve => <MainViewOnboarding onResolve={resolve} />);
}

const PayModal = ({ onClose }: { onClose: () => void }) => {
	return (
		<ActionModal
			title="Activate paid account"
			buttons={
				<ActionButton size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} onClick={() => onClose()}>
					Close
				</ActionButton>
			}
		>
			Please, write to Telegram{' '}
			<a href="https://t.me/mainview_io" target="_blank" rel="noreferrer">
				@mainview_io
			</a>{' '}
			to activate your account.
		</ActionModal>
	);
};

export async function payAccount(params?: { noCloseButton?: boolean; place?: string }) {
	if (params?.place) {
		analytics.userWantsToPay(params.place);
	}

	await showStaticComponent<boolean>(resolve => <PayModal onClose={resolve} />);
}

export async function connectAccount(params?: { noCloseButton?: boolean; place?: string }): Promise<void> {
	if (params?.place) {
		analytics.startConnectingWallet(params.place);
	}

	try {
		const account = await requestAccount(params);
		if (!account) {
			return;
		}

		browserStorage.isAuthorized = true;
		domain.account = account;

		await showStaticComponent<boolean>(resolve => <BuildFeedFlow account={account} onClose={resolve} />);
	} catch (e) {
		console.error(e);
		disconnectAccount();
	}
}

export async function requestAccount(params?: {
	noCloseButton?: boolean;
	place?: string;
}): Promise<DomainAccount | null | undefined> {
	try {
		const addr = await domain.connectAccount();
		if (!addr) {
			return null;
		}
		const address = addr.toLowerCase();
		const mainviewKey = browserStorage.mainViewKeys[address];
		if (!mainviewKey) {
			return await showStaticComponent<DomainAccount | undefined>(resolve => (
				<AuthorizeAccountFlow address={address} onClose={resolve} />
			));
		} else {
			return new DomainAccount(address, mainviewKey);
		}
	} catch (e) {
		console.error(e);
		disconnectAccount();
	}

	return null;
}

export async function disconnectAccount(params?: { place?: string }) {
	const { place } = params || {};

	if (place) {
		analytics.disconnectWallet(place, 'no-wallet-name', domain.account?.address || 'no-address');
	}

	domain.disconnectAccount();
	browserStorage.mainViewKeys = {};
}
