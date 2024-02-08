import { makeAutoObservable } from 'mobx';

import { Section } from '../components/genericLayout/sidebar/sidebarMenu';
import { toggleArrayItem } from '../utils/array';

enum BrowserStorageKey {
	SIDEBAR_FOLDED_SECTIONS = 'ylide_sidebarFoldedSections',
	SESSION = 'ylide_session',
	REFERRER = 'ylide_referrer',
}

class BrowserStorage {
	constructor() {
		makeAutoObservable(this);
	}

	private static getItem<T = string>(key: BrowserStorageKey, storage: Storage = localStorage) {
		return (storage.getItem(key) as T) || undefined;
	}

	private static getItemWithTransform<T>(
		key: BrowserStorageKey,
		transform: (item: string) => T,
		storage: Storage = localStorage,
	): T | undefined {
		const item = storage.getItem(key) || undefined;
		return item ? transform(item) : undefined;
	}

	private static setItem(key: BrowserStorageKey, value: any, storage: Storage = localStorage) {
		if (value != null) {
			storage.setItem(key, value.toString());
		} else {
			storage.removeItem(key);
		}
	}

	private _sidebarFoldedSections =
		BrowserStorage.getItemWithTransform(
			BrowserStorageKey.SIDEBAR_FOLDED_SECTIONS,
			item => item.split(',') as Section[],
		) || [];

	isSidebarSectionFolded(section: Section) {
		return this._sidebarFoldedSections.includes(section);
	}

	toggleSidebarSectionFolding(section: Section) {
		const newValue = toggleArrayItem(this._sidebarFoldedSections, section);
		BrowserStorage.setItem(
			BrowserStorageKey.SIDEBAR_FOLDED_SECTIONS,
			newValue.length ? newValue.join(',') : undefined,
		);
		this._sidebarFoldedSections = newValue;
	}

	//

	private _session =
		BrowserStorage.getItemWithTransform(BrowserStorageKey.SESSION, item => JSON.parse(item) as string | null) ||
		null;

	get session(): string | null {
		return this._session;
	}

	set session(value: string | null) {
		BrowserStorage.setItem(BrowserStorageKey.SESSION, JSON.stringify(value));
		this._session = value;
	}

	//

	get referrer() {
		return BrowserStorage.getItem(BrowserStorageKey.REFERRER) || '';
	}

	set referrer(value: string) {
		BrowserStorage.setItem(BrowserStorageKey.REFERRER, value);
	}
}

export const browserStorage = new BrowserStorage();
// @ts-ignore
window.browserStorage = browserStorage;
