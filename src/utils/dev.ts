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
