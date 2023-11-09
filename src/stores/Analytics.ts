import { jitsuClient } from '@jitsu/sdk-js';

import { REACT_APP__APP_MODE, REACT_APP__CIRCLE_BUILD_NUM, REACT_APP__CIRCLE_SHA1 } from '../env';
import domain from './Domain';

const jitsu = jitsuClient({
	key: 'js.5kscz7ob82krk5gtzgkz0a.dti74ggb24rjznrig051f',
	tracking_host: 'https://data.ylide.io',
});

function track(name: string, payload?: Record<string, any>) {
	jitsu.track(name, {
		host: location.hostname,
		appMode: REACT_APP__APP_MODE,
		circleSha1: REACT_APP__CIRCLE_SHA1,
		circleBuildNum: REACT_APP__CIRCLE_BUILD_NUM,
		numberOfAccounts: domain.accounts.accounts.length,
		...payload,
	});
}

class Analytics {
	pageView(page: string) {
		track('app_page', { page });
	}

	// MISC

	openSocial(type: string) {
		track('open_social', { type });
	}

	openCreateCommunityForm() {
		track('open_create_communify_form');
	}

	// ACCOUNT

	startConnectingWallet(place: string) {
		track('start_connecting_wallet', { place });
	}

	disconnectWallet(place: string, walletName: string, address: string) {
		track('disconnect_wallet', { place, walletName, address });
	}

	walletConnected(walletName: string, address: string) {
		track('wallet_connected', { walletName, address });
	}

	walletRegistered(walletName: string, address: string) {
		track('wallet_registered', { walletName, address });
		this.walletConnected(walletName, address);
	}

	renameAccount(place: string, walletName: string, address: string) {
		track('rename_account', { place, walletName, address });
	}

	// FEED

	feedView(tags: number[]) {
		track('feed___view', { tags });
	}

	feedLoadMore(tags: number[]) {
		track('feed___load_more', { tags });
	}

	// MAIL

	mailFolderOpened(folderId: string) {
		track('mail_folder_opened', { folderId });
	}

	mailOpened(folderId: string) {
		track('mail_opened', { folderId });
	}

	openCompose(place: string) {
		track('open_compose', { place });
	}

	composeOpened(type: string) {
		track('compose_opened', { type });
	}

	mailSentAttempt() {
		track('mail_sent_attempt');
	}

	mailSentSuccessful() {
		track('mail_sent_successful');
	}

	markMailAsRead(count: number) {
		track('mark_mail_as_read', { count });
	}

	archiveMail(place: string, count: number) {
		track('archive_mail', { place, count });
	}

	restoreMail(place: string, count: number) {
		track('restore_mail', { place, count });
	}

	// CONTACTS

	startCreatingContact(place: string) {
		track('start_creating_contact', { place });
	}

	finishCreatingContact(place: string) {
		track('start_creating_contact', { place });
	}

	startEditingContact() {
		track('start_editing_contact');
	}

	finishEditingContact() {
		track('start_editing_contact');
	}

	removeContact() {
		track('remove_contact');
	}

	composeMailToContact() {
		track('compose_mail_to_contact');
	}

	// BLOCKCHAIN FEED

	blockchainFeedView(project: string) {
		track('blockchain_feed___view', { project });
	}

	blockchainFeedLoadMore(project: string) {
		track('blockchain_feed___load_more', { project });
	}

	blockchainFeedReply(project: string, postId: string) {
		track('blockchain_feed___reply', { project, postId });
	}

	blockchainFeedSendAttempt(project: string, isReply: boolean, replyToId?: string) {
		track('blockchain_feed___send_attempt', { project, isReply, replyToId });
	}

	blockchainFeedSendSuccessful(project: string, isReply: boolean, replyToId?: string) {
		track('blockchain_feed___send_successful', { project, isReply, replyToId });
	}

	blockchainFeedOpenDetails(postId: string, msgId: string) {
		track('blockchain_feed___open_details', { postId, msgId });
	}

	blockchainFeedComposeMail(postId: string, address: string) {
		track('blockchain_feed___compose_mail', { postId, address });
	}

	// MAINVIEW

	mainviewFeedSettingsClick(address: string) {
		track('mainview___feed_settings_click', { address });
	}

	mainviewFeedSettingsAddSources(address: string, sourceIds: string[]) {
		track('mainview___feed_settings_add_source', { address, sourceIds });
	}

	mainviewFeedSettingsRemoveSources(address: string, sourceIds: string[]) {
		track('mainview___feed_settings_remove_source', { address, sourceIds });
	}

	mainviewCoverageClick(address: string) {
		track('mainview___coverage_click', { address });
	}

	mainviewSmartFeedClick() {
		track('mainview___smart_feed_click');
	}

	mainviewPersonalFeedClick(address: string) {
		track('mainview___personal_feed_click', { address });
	}

	mainviewTagFeedClick(tagId: number) {
		track('mainview___tag_feed_click', { tagId });
	}

	mainviewTwitterClick() {
		track('mainview___twitter_click');
	}

	mainviewFaqClick() {
		track('mainview___faq_click');
	}

	mainviewOnboardingEvent(type: string, payload?: Record<string, any>) {
		track('mainview__onboarding_event', { type, ...payload });
	}
}

export const analytics = new Analytics();
