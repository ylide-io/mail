export function isIos() {
	return (
		/iPad|iPhone|iPod/i.test(navigator.userAgent) ||
		// iPad on iOS 13 detection
		(navigator.userAgent.includes('Mac') && 'ontouchend' in document)
	);
}

export function isPwa() {
	return window.matchMedia('(display-mode: standalone)').matches;
}
