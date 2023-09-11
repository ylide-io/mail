import consolere from 'console-remote-client';
import { autorun, observable } from 'mobx';
import { nanoid } from 'nanoid';

import { BrowserStorage, BrowserStorageKey } from '../stores/browserStorage';

const lastTimeDb: Record<string, number | undefined> = {};

export function timePoint(params: { key: string }) {
	return (message?: unknown) => {
		const now = Date.now();
		const lastTime = lastTimeDb[params.key] || 0;

		lastTimeDb[params.key] = now;

		console.debug(lastTime ? `@ ${params.key}: ${now - lastTime}ms` : `@ ${params.key}: start`, message);
	};
}

//

export const remoteConsoleChannel = observable.box(
	BrowserStorage.getItem(BrowserStorageKey.REMOTE_CONSOLE, sessionStorage),
);

autorun(() => {
	const channel = remoteConsoleChannel.get();
	if (channel) {
		consolere.connect({
			channel,
			redirectDefaultConsoleToRemote: true,
		});
	}
});

export function enableRemoteConsole() {
	const channel = remoteConsoleChannel.get() || nanoid(8);
	BrowserStorage.setItem(BrowserStorageKey.REMOTE_CONSOLE, channel, sessionStorage);
	remoteConsoleChannel.set(channel);
	return channel;
}
