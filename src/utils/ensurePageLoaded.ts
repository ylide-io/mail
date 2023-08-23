let ensurePageLoaded: Promise<void>;

if (document.readyState === 'complete') {
	ensurePageLoaded = Promise.resolve();
} else {
	ensurePageLoaded = new Promise<void>(resolve => {
		window.addEventListener('load', () => {
			resolve();
		});
	});
}

export { ensurePageLoaded };
