export enum RoutePath {
	TEST = '/test',

	ROOT = '/',
	ANY = '/*',

	// FEED

	FEED = '/feed',
	FEED_ALL = '/feed/all',
	FEED_POST = '/feed/post/:postId',
	FEED_CATEGORY = '/feed/tag/:tag',
	FEED_SOURCE = '/feed/source/:source',
	FEED_SMART = '/feed/smart',
	FEED_SMART_EXACT = '/feed/smart/:feedId',

	// AUTH

	AUTH = '/auth/:slug',

	// FAQ

	FAQ = '/faq',
}
