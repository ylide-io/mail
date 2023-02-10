export function filterObjectEntries<V>(
	object: Record<string, V>,
	predicate: (key: string, value: V) => boolean,
): Record<string, V> {
	return Object.keys(object)
		.filter(key => predicate(key, object[key]))
		.reduce((obj, key) => {
			obj[key] = object[key];
			return obj;
		}, {} as Record<string, V>);
}
