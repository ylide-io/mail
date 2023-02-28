export function getElementParent(
	element: HTMLElement,
	predicate: (parent: HTMLElement) => boolean,
): HTMLElement | null {
	let parent: HTMLElement = element;
	while (parent.parentElement != null) {
		parent = parent.parentElement;
		if (predicate(parent)) {
			return parent;
		}
	}
	return null;
}

export function getElementParentOrSelf(
	element: HTMLElement,
	predicate: (parent: HTMLElement) => boolean,
): HTMLElement | null {
	return predicate(element) ? element : getElementParent(element, predicate);
}
