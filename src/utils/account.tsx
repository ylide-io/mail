import { observer } from 'mobx-react';

import { AuthorizeAccountFlow, BuildFeedFlow } from '../components/mainViewOnboarding/mainViewOnboarding';
import { PaymentModal } from '../components/paymentModal/paymentModal';
import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import { analytics } from '../stores/Analytics';
import { browserStorage } from '../stores/browserStorage';
import domain from '../stores/Domain';
import { DomainAccount } from '../stores/models/DomainAccount';
import { truncateInMiddle } from './string';

export function formatAccountName(account: DomainAccount) {
	return truncateInMiddle(account.address, 8, '..');
}

const PayModal = observer(({ onClose }: { onClose: () => void }) => {
	return <PaymentModal account={domain.account!} onResolve={() => onClose()} />;
});

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

		const res = await showStaticComponent<boolean>(resolve => (
			<BuildFeedFlow account={account} onClose={resolve} />
		));
		if (res) {
			document.location.href = '/feed/smart/' + encodeURIComponent(account.address);
		}
	} catch (e) {
		console.error(e);
		disconnectAccount(params);
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
		disconnectAccount(params);
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
