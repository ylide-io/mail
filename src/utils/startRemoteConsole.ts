import consolere from 'console-remote-client';

export const startRemoteConsole = () => {
	const randomChannelName = 'yld-' + Math.random().toString(36).substring(2, 8);
	consolere.connect({
		server: 'https://console.re', // optional, default: https://console.re
		channel: randomChannelName, // required
		redirectDefaultConsoleToRemote: true, // optional, default: false
		disableDefaultConsoleOutput: false, // optional, default: false
	});
	return randomChannelName;
};
