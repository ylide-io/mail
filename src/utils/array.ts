export function toggleArrayItem<T>(array: T[], item: T, isAdded: boolean) {
	const arrayWithoutItem = array.filter(it => it !== item);

	return isAdded ? arrayWithoutItem.concat(item) : arrayWithoutItem;
}
