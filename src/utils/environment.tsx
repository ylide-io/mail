import UAParser from 'ua-parser-js';

const uaParser = new UAParser();

export function isIosSafari() {
	return (
		!!uaParser.getBrowser().name?.includes('Safari') &&
		!!uaParser.getDevice().type?.match(/mobile|tablet/) &&
		uaParser.getOS().name === 'iOS'
	);
}

export function isPwa() {
	return window.matchMedia('(display-mode: standalone)').matches;
}
