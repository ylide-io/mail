import UAParser from 'ua-parser-js';

const uaParser = new UAParser();

export function isIosSafari() {
	return (
		uaParser.getBrowser().name === 'Mobile Safari' &&
		!!uaParser.getDevice().type?.match(/mobile|tablet/) &&
		uaParser.getOS().name === 'iOS'
	);
}

export function isIosSafariWithAddToHomeScreenFeature() {
	const v = uaParser.getBrowser().version || '';
	const vParts = v.split('.');
	const vMajor = Number(vParts[0]);
	const vMinor = Number(vParts[1]);
	const is164OrHigher = vMajor > 16 || (vMajor === 16 && vMinor >= 4);

	return isIosSafari() && is164OrHigher;
}

export function isPwa() {
	return window.matchMedia('(display-mode: standalone)').matches;
}
