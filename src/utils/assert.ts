export function invariant(
	condition: unknown,
	info?: string | Error | (() => string | Error | unknown),
): asserts condition {
	if (condition) return;

	const message = typeof info === 'function' ? info() : info;

	if (message instanceof Error) {
		throw message;
	} else {
		throw new Error(typeof message === 'string' ? message : 'Invariant failed');
	}
}

export function assertUnreachable(_value: never): never {
	throw new Error("Didn't expect to get here");
}
