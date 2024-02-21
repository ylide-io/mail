import { observer } from 'mobx-react';

import { AuthorizeAccountFlow } from '../components/mainViewOnboarding/mainViewOnboarding';
import { PaymentModal } from '../components/paymentModal/paymentModal';
import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import { analytics } from '../stores/Analytics';
import domain from '../stores/Domain';
import { DomainAccount } from '../stores/models/DomainAccount';
import { truncateInMiddle } from './string';
import { browserStorage } from '../stores/browserStorage';

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

export async function connectWalletAccount(params?: { noCloseButton?: boolean; place?: string }): Promise<boolean> {
	if (params?.place) {
		analytics.startConnectingWallet(params.place);
	}

	try {
		const result = await requestWalletAccount(params);
		if (!result) {
			return false;
		}
		// we don't need connection to the wallet after successful authorization
		domain.disconnectWalletAccount();

		const { account } = result;

		browserStorage.isOnboarded = false;
		domain.account = account;

		return true;
	} catch (e) {
		console.error(e);
		domain.disconnectWalletAccount();

		return false;
	}
}

export async function requestWalletAccount(params?: {
	noCloseButton?: boolean;
	place?: string;
}): Promise<{ account: DomainAccount; initing: boolean } | undefined> {
	try {
		const addr = await domain.requestWalletAccount();
		if (!addr) {
			return undefined;
		}
		const address = addr.toLowerCase();
		return await showStaticComponent<{ account: DomainAccount; initing: boolean } | undefined>(resolve => (
			<AuthorizeAccountFlow address={address} onClose={resolve} />
		));
	} catch (e) {
		console.error(e);
		domain.disconnectWalletAccount();
	}

	return undefined;
}
