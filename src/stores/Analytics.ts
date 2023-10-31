import { jitsuClient } from '@jitsu/sdk-js';

import { REACT_APP__APP_MODE, REACT_APP__CIRCLE_SHA1 } from '../env';

const jitsu = jitsuClient({
	key: 'js.5kscz7ob82krk5gtzgkz0a.dti74ggb24rjznrig051f',
	tracking_host: 'https://data.ylide.io',
});

interface EventParams {
	host: string;
	numberOfAccounts: number;
}

class Analytics {
	private getParams: () => EventParams = () => {
		throw new Error('Analytics not initialized');
	};

	init(getParams: () => EventParams) {
		this.getParams = getParams;
	}

	private track(name: string, payload?: Record<string, any>) {
		const params = this.getParams();

		jitsu.track(name, {
			host: params.host,
			appMode: REACT_APP__APP_MODE,
			circleSha1: REACT_APP__CIRCLE_SHA1,
			numberOfAccounts: params.numberOfAccounts,
			...payload,
		});
	}

	//

	pageView(page: string) {
		this.track('app_page', { page });
	}

	// MISC

	openSocial(type: string) {
		this.track('open_social', { type });
	}

	openCreateCommunityForm(place: string) {
		this.track('open_create_community_form', { place });
	}

	// ACCOUNT

	startConnectingWallet(place: string) {
		this.track('start_connecting_wallet', { place });
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

	feedView(tags: number[]) {
		this.track('feed___view', { tags });
	}

	feedLoadMore(tags: number[]) {
		this.track('feed___load_more', { tags });
	}

	// MAIL

	mailFolderOpened(folderId: string) {
		this.track('mail_folder_opened', { folderId });
	}

	mailOpened(folderId: string) {
		this.track('mail_opened', { folderId });
	}

	openCompose(place: string) {
		this.track('open_compose', { place });
	}

	composeOpened(type: string) {
		this.track('compose_opened', { type });
	}

	mailSentAttempt() {
		this.track('mail_sent_attempt');
	}

	mailSentSuccessful() {
		this.track('mail_sent_successful');
	}

	markMailAsRead(count: number) {
		this.track('mark_mail_as_read', { count });
	}

	archiveMail(place: string, count: number) {
		this.track('archive_mail', { place, count });
	}

	restoreMail(place: string, count: number) {
		this.track('restore_mail', { place, count });
	}

	// CONTACTS

	startCreatingContact(place: string) {
		this.track('start_creating_contact', { place });
	}

	finishCreatingContact(place: string) {
		this.track('start_creating_contact', { place });
	}

	startEditingContact() {
		this.track('start_editing_contact');
	}

	finishEditingContact() {
		this.track('start_editing_contact');
	}

	removeContact() {
		this.track('remove_contact');
	}

	composeMailToContact() {
		this.track('compose_mail_to_contact');
	}

	// BLOCKCHAIN FEED

	blockchainFeedView(project: string) {
		this.track('blockchain_feed___view', { project });
	}

	blockchainFeedLoadMore(project: string) {
		this.track('blockchain_feed___load_more', { project });
	}

	blockchainFeedReply(project: string, postId: string) {
		this.track('blockchain_feed___reply', { project, postId });
	}

	blockchainFeedSendAttempt(project: string, isReply: boolean, replyToId?: string) {
		this.track('blockchain_feed___send_attempt', { project, isReply, replyToId });
	}

	blockchainFeedSendSuccessful(project: string, isReply: boolean, replyToId?: string) {
		this.track('blockchain_feed___send_successful', { project, isReply, replyToId });
	}

	blockchainFeedOpenDetails(postId: string, msgId: string) {
		this.track('blockchain_feed___open_details', { postId, msgId });
	}

	blockchainFeedComposeMail(postId: string, address: string) {
		this.track('blockchain_feed___compose_mail', { postId, address });
	}

	// PWA

	pushReceived(type: string) {
		this.track('push__received', { type });
	}

	pushClicked(type: string) {
		this.track('push__clicked', { type });
	}
}

export const analytics = new Analytics();
