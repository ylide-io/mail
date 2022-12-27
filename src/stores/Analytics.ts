import { jitsuClient } from '@jitsu/sdk-js';
//init
const jitsu = jitsuClient({
	key: 'js.5kscz7ob82krk5gtzgkz0a.dti74ggb24rjznrig051f',
	tracking_host: 'https://data.ylide.io',
});

class Analytics {
	// +
	pageView(page: string) {
		jitsu.track('app_page', { page });
	}

	// +
	walletConnected(walletName: string, address: string, walletsCount: number) {
		jitsu.track('wallet_connected', { walletName, address, walletsCount });
		jitsu.track(`wallet_connected_${walletsCount}`, { walletName, address, walletsCount });
	}

	// +
	walletRegistered(walletName: string, address: string, walletsCount: number) {
		jitsu.track('wallet_registered', { walletName, address, walletsCount });
		this.walletConnected(walletName, address, walletsCount);
	}

	// +
	feedPageLoaded(category: string, pageNumber: number) {
		jitsu.track('feed_page', { category, pageNumber });
	}

	// +
	mailFolderOpened(folderId: string) {
		jitsu.track('mail_folder_opened', { folderId });
	}

	// +
	mailOpened(folderId: string) {
		jitsu.track('mail_opened', { folderId });
	}

	// +
	composeOpened() {
		jitsu.track('compose_opened');
	}

	// +
	mailSentAttempt() {
		jitsu.track('mail_sent_attempt');
	}

	// +
	mailSentSuccessful() {
		jitsu.track('mail_sent_successful');
	}
}

const analytics = new Analytics();
export { analytics };
