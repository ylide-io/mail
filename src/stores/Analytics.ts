import { jitsuClient } from '@jitsu/sdk-js';

import domain from './Domain';

const jitsu = jitsuClient({
	key: 'js.5kscz7ob82krk5gtzgkz0a.dti74ggb24rjznrig051f',
	tracking_host: 'https://data.ylide.io',
});

class Analytics {
	pageView(page: string) {
		jitsu.track('app_page', { page });
	}

	// MISC

	openSocial(type: string) {
		jitsu.track('open_social', { type });
	}

	// ACCOUNT

	startConnectingWallet(place: string) {
		jitsu.track('start_connecting_wallet', { place, walletsCount: domain.accounts.accounts.length });
	}

	disconnectWallet(place: string, walletName: string, address: string) {
		jitsu.track('disconnect_wallet', { place, walletName, address, walletsCount: domain.accounts.accounts.length });
	}

	walletConnected(walletName: string, address: string) {
		jitsu.track('wallet_connected', { walletName, address, walletsCount: domain.accounts.accounts.length });
	}

	walletRegistered(walletName: string, address: string) {
		jitsu.track('wallet_registered', { walletName, address, walletsCount: domain.accounts.accounts.length });
		this.walletConnected(walletName, address);
	}

	renameAccount(place: string, walletName: string, address: string) {
		jitsu.track('rename_account', { place, walletName, address });
	}

	// FEED

	feedView(categories: string[]) {
		jitsu.track('feed_view', { categories });
	}

	feedLoadMore(categories: string[]) {
		jitsu.track('feed_load_more', { categories });
	}

	// MAIL

	mailFolderOpened(folderId: string) {
		jitsu.track('mail_folder_opened', { folderId });
	}

	mailOpened(folderId: string) {
		jitsu.track('mail_opened', { folderId });
	}

	openCompose(place: string) {
		jitsu.track('open_compose', { place });
	}

	composeOpened(type: string) {
		jitsu.track('compose_opened', { type });
	}

	mailSentAttempt() {
		jitsu.track('mail_sent_attempt');
	}

	mailSentSuccessful() {
		jitsu.track('mail_sent_successful');
	}

	markMailAsRead(count: number) {
		jitsu.track('mark_mail_as_read', { count });
	}

	archiveMail(place: string, count: number) {
		jitsu.track('archive_mail', { place, count });
	}

	restoreMail(place: string, count: number) {
		jitsu.track('restore_mail', { place, count });
	}

	// CONTACTS

	startCreatingContact(place: string) {
		jitsu.track('start_creating_contact', { place });
	}

	finishCreatingContact(place: string) {
		jitsu.track('start_creating_contact', { place });
	}

	startEditingContact() {
		jitsu.track('start_editing_contact');
	}

	finishEditingContact() {
		jitsu.track('start_editing_contact');
	}

	removeContact() {
		jitsu.track('remove_contact');
	}

	composeMailToContact() {
		jitsu.track('compose_mail_to_contact');
	}

	// VENOM FEED

	venomFeedView(project: string) {
		jitsu.track('venom_feed_view', { project });
	}

	venomFeedLoadMore(project: string) {
		jitsu.track('venom_feed_load_more', { project });
	}

	venomFeedReply(project: string, postId: string) {
		jitsu.track('venom_feed_reply', { project, postId });
	}

	venomFeedSendAttempt(project: string, isReply: boolean, replyToId?: string) {
		jitsu.track('venom_feed_send_attempt', { project, isReply, replyToId });
	}

	venomFeedSendSuccessful(project: string, isReply: boolean, replyToId?: string) {
		jitsu.track('venom_feed_send_successful', { project, isReply, replyToId });
	}

	venomFeedOpenDetails(postId: string, msgId: string) {
		jitsu.track('venom_feed_open_details', { postId, msgId });
	}

	venomFeedComposeMail(postId: string, address: string) {
		jitsu.track('venom_feed_compose_mail', { postId, address });
	}
}

const analytics = new Analytics();
export { analytics };
