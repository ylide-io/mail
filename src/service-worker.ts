/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

import { clientsClaim } from 'workbox-core';

import { truncateAddress } from './utils/string';

declare const self: ServiceWorkerGlobalScope;

setInterval(() => {
	console.log('Service worker version', 5);
}, 5000);

//

function formatAddress(address: string) {
	return (
		address
			.toLowerCase()
			// 000000000000000000000000d3c2b7b1ebcd6949abcf1041cc629b2648ad2329 -> 0xd3c2b7b1ebcd6949abcf1041cc629b2648ad2329
			.replace(/^0{24}/, '0x')
			// 3f4dcce76d4760fb23879fee1a28f278b0739f99c13911094418c042fb7fbc45 -> 0:3f4dcce76d4760fb23879fee1a28f278b0739f99c13911094418c042fb7fbc45
			.replace(/^([a-f0-9]{64})$/i, '0:$1')
	);
}

function compareAddresses(a: string, b: string) {
	return formatAddress(a) === formatAddress(b);
}

const ylideContacts = {
	'team.ylide': '0x9Eb187e2b5280c41b1e6723b0F215331a099dc65',
	'ignat.ylide': '0x9B44ed2A5de91f4E9109453434825a32FF2fD6e7',
	'danila.ylide': '0x15a33D60283e3D20751D6740162D1212c1ad2a2d',
	'kirill.ylide': '0x0962C57d9e451df7905d40cb1b33F179d75f6Af0',
};

//

enum NotificationType {
	INCOMING_MAIL = 'INCOMING_MAIL',
	POST_REPLY = 'POST_REPLY',
}

interface IncomingMailData {
	type: NotificationType.INCOMING_MAIL;
	body: {
		senderAddress: string;
		recipientAddress: string;
		msgId: string;
	};
}

interface PostReplyData {
	type: NotificationType.POST_REPLY;
	body: {
		feedId: string;
		author: {
			address: string;
			postId: string;
		};
		reply: {
			address: string;
			postId: string;
		};
	};
}

function parseNotificationData(data: unknown) {
	console.debug('Parsing push data', data);
	return JSON.parse(data as string) as IncomingMailData | PostReplyData;
}

//

clientsClaim();

// CACHE

const CACHE_NAME = 'MAIN';

const indexHtmlRegexp = /^\/index\.html/i;
const fileExtensionRegexp = /[^/?]+\\.[^/]+$/;

async function networkFirst(request: Request) {
	const cache = await caches.open(CACHE_NAME);

	const fetchResult = await fetch(request);
	if (fetchResult.ok) {
		cache.put(request, fetchResult.clone());
		return fetchResult;
	}

	return (await cache.match(request)) || Response.error();
}

async function cacheFirst(request: Request) {
	const cache = await caches.open(CACHE_NAME);
	const cacheResult = await cache.match(request);
	if (cacheResult) return cacheResult;

	const fetchResult = await fetch(request);
	if (fetchResult.ok) {
		cache.put(request, fetchResult.clone());
		return fetchResult;
	}

	return Response.error();
}

self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);

	if (url.pathname.match(indexHtmlRegexp)) {
		return event.respondWith(networkFirst(event.request));
	}

	if (url.pathname.match(fileExtensionRegexp)) {
		return event.respondWith(cacheFirst(event.request));
	}
});

//

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', event => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

// Any other custom service worker logic can go here.
self.addEventListener('push', async event => {
	console.log('Push received', event);

	function showNotification(title: string, options?: NotificationOptions) {
		event.waitUntil(
			self.registration.showNotification(title, {
				icon: '/push-notification-icon.png',
				badge: '/push-notification-badge.png',
				...options,
			}),
		);
	}

	if (event.data) {
		const rawData = event.data.text();
		const data = parseNotificationData(rawData);

		if (data.type === NotificationType.INCOMING_MAIL) {
			const senderAddress = data.body.senderAddress;
			const contact = Object.entries(ylideContacts).find(([, address]) =>
				compareAddresses(address, senderAddress),
			);

			showNotification('New message', {
				body: `You've got a new encrypted message from ${
					contact ? contact[0] : truncateAddress(senderAddress)
				}`,
				data: rawData,
			});
		}

		if (data.type === NotificationType.POST_REPLY) {
			showNotification('New reply', {
				body: `You've got a new reply from ${truncateAddress(data.body.reply.address)}`,
				data: rawData,
			});
		}
	}
});

self.addEventListener('notificationclick', event => {
	console.log('Notification click received', event);

	event.notification.close();

	const data = parseNotificationData(event.notification.data);

	if (data.type === NotificationType.INCOMING_MAIL) {
		const url = `/mail/inbox/${encodeURIComponent(`${data.body.msgId}:${data.body.recipientAddress}`)}`;
		event.waitUntil(self.clients.openWindow(url));
	}

	if (data.type === NotificationType.POST_REPLY) {
		const url = `/post/${encodeURIComponent(data.body.reply.postId)}`;
		event.waitUntil(self.clients.openWindow(url));
	}
});
