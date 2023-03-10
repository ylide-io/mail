export function invariant(condition: unknown, info?: string | Error | (() => string | Error)): asserts condition {
	if (condition) return;

	const message = (info instanceof Error ? info : typeof info === 'function' ? info() : info) || 'Invariant failed';

	if (message instanceof Error) {
		throw message;
	} else {
		throw new Error(message);
	}
}

export function assertUnreachable(_value: never): never {
	throw new Error("Didn't expect to get here");
}
