export function constrain(num: number, min?: number | null, max?: number | null) {
	return min != null && num < min ? min : max != null && num > max ? max : num;
}
