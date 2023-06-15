export function escapeRegex(text: string) {
	return text.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}
