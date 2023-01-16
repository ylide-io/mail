export function truncateInMiddle(string: string, charCount: number, separator?: string) {
	if (charCount <= 0) return string;

	const targetLength = Math.max(string.length - Math.min(string.length, charCount), separator ? 2 : 1);
	const leftSize = Math.ceil(targetLength / 2);
	const rightSize = targetLength - leftSize;

	if (rightSize) {
		const parts = [string.slice(0, leftSize), string.slice(-rightSize)];
		return parts.join(separator || '');
	} else {
		return string.slice(0, leftSize);
	}
}
