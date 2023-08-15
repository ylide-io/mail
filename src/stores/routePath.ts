export enum RoutePath {
	TEST = '/test',
	ADMIN = '/admin',
	ADMIN_FEED = '/admin/feed',

	ROOT = '/',
	ANY = '/*',

	// APP

	SETTINGS = '/settings',
	WALLETS = '/wallets',

	MAIL = '/mail',
	MAIL_COMPOSE = '/mail/compose',
	MAIL_CONTACTS = '/mail/contacts',
	MAIL_CONTACT_TAGS = '/mail/contacts/tags',
	MAIL_FOLDER = '/mail/:folderId',
	MAIL_FOLDER_DETAILS = '/mail/:folderId/:id',
	MAIL_DETAILS_OUTLET = ':id',

	FEED = '/feed',
	FEED_ALL = '/feed/all',
	FEED_POST_ID = '/feed/post/:postId',
	FEED_CATEGORY_ID = '/feed/tag/:tag',
	FEED_SOURCE_ID = '/feed/source/:source',
	FEED_SMART = '/feed/smart',
	FEED_SMART_ADDRESS = '/feed/smart/:address',

	PROJECT = '/project',
	PROJECT_ID = '/project/:projectId',
	PROJECT_ID_OFFICIAL = '/project/:projectId/announcements',
	PROJECT_ID_OFFICIAL_ADMIN = '/project/:projectId/announcements/admin',
	PROJECT_ID_POST_ID = '/project/:projectId/post/:postId',
	PROJECT_ID_DISCUSSION = '/project/:projectId/discussion',
	PROJECT_ID_DISCUSSION_ADMIN = '/project/:projectId/discussion/admin',

	OTC = '/otc',
	OTC_ASSETS = '/otc/assets',
	OTC_WALLETS = '/otc/wallets',
	OTC_CHATS = '/otc/chats',
	OTC_CHATS_ID = '/otc/chats/:address',

	// WIDGETS

	WIDGET_SENDMESSAGE = '/widget/send-message',
	WIDGET_MAILBOX = '/widget/mailbox',
}
