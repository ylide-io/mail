import { useEffect } from 'react';

import { BlockchainFeedApi } from '../api/blockchainFeedApi';
import { REACT_APP__HUB_VAPID_PUBLIC_KEY } from '../env';
import domain from '../stores/Domain';
import { DomainAccount } from '../stores/models/DomainAccount';

function enableNotifications(accounts: DomainAccount[]) {
	function subscribe() {
		navigator.serviceWorker
			.getRegistration()
			.then(registration => {
				function urlBase64ToUint8Array(base64String: string) {
					const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
					const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
					const rawData = atob(base64);
					const outputArray = new Uint8Array(rawData.length);
					for (let i = 0; i < rawData.length; ++i) {
						outputArray[i] = rawData.charCodeAt(i);
					}
					return outputArray;
				}

				return registration?.pushManager.subscribe({
					applicationServerKey: urlBase64ToUint8Array(REACT_APP__HUB_VAPID_PUBLIC_KEY!),
					userVisibleOnly: true,
				});
			})
			.then(
				subscription =>
					subscription &&
					Promise.all(
						accounts.map(a =>
							BlockchainFeedApi.saveNotificationSubscription({
								address: a.account.address,
								authKey: a.authKey,
								subscription,
							}),
						),
					),
			);
	}

	navigator?.permissions?.query({ name: 'notifications' }).then(r => {
		console.debug('Notification permissions:', r.state);

		if (r.state === 'prompt') {
			Notification.requestPermission().then(result => {
				if (result === 'granted') {
					subscribe();
				}
			});
		} else if (r.state === 'granted') {
			subscribe();
		}
	});
}

export function PushNotificationsEnabler() {
	const accounts = domain.accounts.activeAccounts;

	useEffect(() => {
		// Check notifications on page load.
		// This will work on any device except iOS Safari,
		// where it's required to check notifications on user interaction.

		if (!accounts.length) return;

		enableNotifications(accounts);

		const clickListener = () => {
			document.body.removeEventListener('click', clickListener);
			enableNotifications(accounts);
		};

		document.body.addEventListener('click', clickListener);

		return () => {
			document.body.removeEventListener('click', clickListener);
		};
	}, [accounts]);

	return <></>;
}
