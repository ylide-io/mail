import { autorun, observable } from 'mobx';

export enum Lang {
	EN = 'EN',
}

export const currentLang = observable.box(Lang.EN);

export function createL10n<T extends object>(data: Record<Lang, T>): T {
	const output = observable({} as T);

	autorun(() => {
		const langData = data[currentLang.get()];

		for (const key in langData) {
			output[key] = langData[key];
		}
	});

	return output;
}
