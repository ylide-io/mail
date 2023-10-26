export enum RoutePath {
	TEST = '/test',
	ADMIN = '/admin',
	ADMIN_FEED = '/admin/feed',

	ROOT = '/',
	ANY = '/*',

	// APP

	WALLETS = '/wallets',
	WALLETS_CONNECT = '/connect-wallets',

	MAIL_COMPOSE = '/mail/compose',
	MAIL_CONTACTS = '/mail/contacts',
	MAIL_CONTACT_TAGS = '/mail/contacts/tags',
	MAIL_FOLDER = '/mail/:folderId',
	MAIL_DETAILS = '/mail/:folderId/:id',
	MAIL_DETAILS_OUTLET = ':id',

	FEED = '/feed',
	FEED_ALL = '/feed/all',
	FEED_POST = '/feed/post/:postId',
	FEED_CATEGORY = '/feed/tag/:tag',
	FEED_SOURCE = '/feed/source/:source',
	FEED_SMART = '/feed/smart',
	FEED_SMART_ADDRESS = '/feed/smart/:address',
	FEED_PROJECT = '/feed/project',
	FEED_PROJECT_POSTS = '/feed/project/:projectId',
	FEED_PROJECT_POSTS_ADMIN = '/feed/project/:projectId/admin',
	FEED_PROJECT_POST = '/feed/project/:projectId/:postId',

	SETTINGS_ADDRESS = '/settings/:address',
	SETTINGS_ADDRESS_SECTION = '/settings/:address/:section',

	OTC_ASSETS = '/otc/assets',
	OTC_WALLETS = '/otc/wallets',
	OTC_CHATS = '/otc/chats',
	OTC_CHAT = '/otc/chats/:address',

	// WIDGETS

	SEND_MESSAGE_WIDGET = '/widget/send-message',
	MAILBOX_WIDGET = '/widget/mailbox',

	// FAQ

	FAQ = '/faq',
}
