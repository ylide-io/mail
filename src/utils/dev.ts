import consolere from 'console-remote-client';
import { autorun, observable } from 'mobx';
import { nanoid } from 'nanoid';

import { BrowserStorage, BrowserStorageKey } from '../stores/browserStorage';

let lastTime = 0;

export function timePoint(data?: unknown) {
	const now = Date.now();

	if (lastTime) {
		console.log(`@ ${now - lastTime}ms`, data);
	} else {
		console.log(`@ start`, data);
	}

	lastTime = now;
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
