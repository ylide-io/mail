export enum RoutePath {
	TEST = '/test',
	ADMIN = '/admin',

	ANY = '/*',

	SETTINGS = '/settings',

	WALLETS = '/wallets',
	WALLETS_CONNECT = '/connect-wallets',

	MAIL_COMPOSE = '/mail/compose',
	MAIL_CONTACTS = '/mail/contacts',
	MAIL_FOLDERS = '/mail/folders',
	MAIL_FOLDER = '/mail/:folderId',
	MAIL_DETAILS = '/mail/:folderId/:id',

	FEED = '/feed',
	FEED_POST = '/feed/post/:id',
	FEED_CATEGORY = '/feed/:category',

	OTC_EXPLORER = '/otc/explorer',
	OTC_CHATS = '/otc/chats',
}
