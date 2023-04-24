export enum RoutePath {
	TEST = '/test',
	ADMIN = '/admin',

	ROOT = '/',
	ANY = '/*',

	// APP

	SETTINGS = '/settings',

	WALLETS = '/wallets',
	WALLETS_CONNECT = '/connect-wallets',

	MAIL_COMPOSE = '/mail/compose',
	MAIL_CONTACTS = '/mail/contacts',
	MAIL_CONTACT_TAGS = '/mail/contacts/tags',
	MAIL_FOLDER = '/mail/:folderId',
	MAIL_DETAILS = '/mail/:folderId/:id',

	FEED = '/feed',
	FEED_POST = '/feed/post/:id',
	FEED_CATEGORY = '/feed/:category',

	OTC_ASSETS = '/otc/assets',
	OTC_WALLETS = '/otc/wallets',
	OTC_CHATS = '/otc/chats',
	OTC_CHAT = '/otc/chats/:address',

	// WIDGETS

	WIDGET = '/widget',
	SEND_MESSAGE_WIDGET = '/widget/send-message',
	MAILBOX_WIDGET = '/widget/mailbox',
}
