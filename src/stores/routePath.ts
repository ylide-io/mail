export enum RoutePath {
	TEST = '/test',
	ADMIN = '/admin',
	ADMIN_FEED = '/admin/feed',

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
	FEED_ALL = '/feed/all',
	FEED_POST = '/feed/post/:postId',
	FEED_CATEGORY = '/feed/category/:category',
	FEED_SOURCE = '/feed/source/:source',
	FEED_SMART = '/feed/smart',
	FEED_SMART_ADDRESS = '/feed/smart/:address',
	FEED_VENOM = '/feed/venom',
	FEED_VENOM_PROJECT = '/feed/venom/:project',
	FEED_VENOM_ADMIN = '/feed/venom/:project/admin',
	FEED_TVM = '/feed/tvm',
	FEED_TVM_PROJECT = '/feed/tvm/:project',
	FEED_TVM_ADMIN = '/feed/tvm/:project/admin',

	OTC_ASSETS = '/otc/assets',
	OTC_WALLETS = '/otc/wallets',
	OTC_CHATS = '/otc/chats',
	OTC_CHAT = '/otc/chats/:address',

	// WIDGETS

	SEND_MESSAGE_WIDGET = '/widget/send-message',
	MAILBOX_WIDGET = '/widget/mailbox',
}
