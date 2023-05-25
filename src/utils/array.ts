import { invariant } from './assert';
import { randomInt } from './number';

export function toggleArrayItem<T>(array: T[], item: T, isAdded?: boolean) {
	isAdded = isAdded != null ? isAdded : !array.includes(item);

	const arrayWithoutItem = array.filter(it => it !== item);

	return isAdded ? arrayWithoutItem.concat(item) : arrayWithoutItem;
}

export function randomArrayElem<T>(array: T[]): T {
	invariant(array.length, 'Array cannot be empty');
	return array[randomInt(0, array.length - 1)];
}

export function uint8ArrayToDataURL(uint8Array: Uint8Array): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			resolve(reader.result!.toString());
		};

		reader.onerror = e => reject(e);

		reader.readAsDataURL(new Blob([uint8Array]));
	});
}
