export function toggleArrayItem<T>(array: T[], item: T, isAdded?: boolean) {
	isAdded = isAdded != null ? isAdded : !array.includes(item);

	const arrayWithoutItem = array.filter(it => it !== item);

	return isAdded ? arrayWithoutItem.concat(item) : arrayWithoutItem;
}
