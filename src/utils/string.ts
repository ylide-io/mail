export function truncateInMiddle(string: string, maxLength: number, separator?: string) {
	if (maxLength >= string.length) return string;

	const targetLength = Math.max(maxLength, separator ? 2 : 1);
	const leftSize = Math.ceil(targetLength / 2);
	const rightSize = targetLength - leftSize;

	if (rightSize) {
		const parts = [string.slice(0, leftSize), string.slice(-rightSize)];
		return parts.join(separator || '');
	} else {
		return string.slice(0, leftSize);
	}
}
