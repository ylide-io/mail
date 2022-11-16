export function safeJson(val: any, def: any) {
	try {
		return JSON.parse(val);
	} catch (err) {
		return def;
	}
}
