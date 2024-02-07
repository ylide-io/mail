import { jitsuClient } from '@jitsu/sdk-js';

import { FeedServerApi } from '../api/feedServerApi';
import { REACT_APP__CIRCLE_BUILD_NUM, REACT_APP__CIRCLE_SHA1 } from '../env';
import domain from './Domain';

const jitsu = jitsuClient({
	key: 'js.5kscz7ob82krk5gtzgkz0a.dti74ggb24rjznrig051f',
	tracking_host: 'https://data.ylide.io',
});

function _track(name: string, payload?: Record<string, any>) {
	jitsu.track(name, {
		host: location.hostname,
		appMode: 'MAIN_VIEW',
		circleSha1: REACT_APP__CIRCLE_SHA1,
		circleBuildNum: REACT_APP__CIRCLE_BUILD_NUM,
		numberOfAccounts: domain.account ? 1 : 0,
		address: domain.account ? domain.account.address : null,
		...payload,
	});
}

class Analytics {
	track(name: string, payload?: Record<string, any>) {
		_track(name, payload);
	}

	pageView(page: string) {
		this.track('app_page', { page });
	}

	// MISC

	openSocial(type: string) {
		this.track('open_social', { type });
	}

	openCreateCommunityForm() {
		this.track('open_create_communify_form');
	}

	// ACCOUNT

	startConnectingWallet(place: string) {
		this.track('start_connecting_wallet', { place });
	}

	userWantsToPay(place: string) {
		this.track('user_wants_to_pay', { place });
	}

	disconnectWallet(place: string, walletName: string, address: string) {
		this.track('disconnect_wallet', { place, walletName, address });
	}

	walletConnected(walletName: string, address: string) {
		this.track('wallet_connected', { walletName, address });
	}

	walletRegistered(walletName: string, address: string) {
		this.track('wallet_registered', { walletName, address });
		this.walletConnected(walletName, address);
	}

	renameAccount(place: string, walletName: string, address: string) {
		this.track('rename_account', { place, walletName, address });
	}

	// FEED

	feedView(feed: FeedServerApi.FeedDescriptor) {
		this.track('feed___view', { feed });
	}

	feedLoadMore(feed: FeedServerApi.FeedDescriptor) {
		this.track('feed___load_more', { feed });
	}

	// MAINVIEW

	mainviewFeedSettingsClick(address: string) {
		this.track('mainview___feed_settings_click', { address });
	}

	mainviewFeedSettingsAddSources(address: string, sourceIds: string[]) {
		this.track('mainview___feed_settings_add_source', { address, sourceIds });
	}

	mainviewFeedSettingsRemoveSources(address: string, sourceIds: string[]) {
		this.track('mainview___feed_settings_remove_source', { address, sourceIds });
	}

	mainviewCoverageClick(address: string) {
		this.track('mainview___coverage_click', { address });
	}

	mainviewSmartFeedClick() {
		this.track('mainview___smart_feed_click');
	}

	mainviewPersonalFeedClick(address: string) {
		this.track('mainview___personal_feed_click', { address });
	}

	mainviewTagFeedClick(tagId: number) {
		this.track('mainview___tag_feed_click', { tagId });
	}

	mainviewTwitterClick() {
		this.track('mainview___twitter_click');
	}

	mainviewFaqClick() {
		this.track('mainview___faq_click');
	}

	mainviewOnboardingEvent(type: string, payload?: Record<string, any>) {
		this.track('mainview__onboarding_event', { type, ...payload });
	}
}

export const analytics = new Analytics();
