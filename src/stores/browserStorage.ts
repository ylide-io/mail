import { makeAutoObservable } from 'mobx';

export interface FeedSourceSettings {
	listId: string;
	sourceIds: string[];
}

enum BrowserStorageKey {
	CAN_SKIP_REGISTRATION = 'can_skip_registration',
	QUEST3 = 'quest3',
	FEED_SOURCE_SETTINGS = 'ylide_feedSourceSettings',
}

class BrowserStorage {
	constructor() {
		makeAutoObservable(this);
	}

	private static getItem(key: BrowserStorageKey) {
		return localStorage.getItem(key) || undefined;
	}

	private static getItemWithTransform<T>(key: BrowserStorageKey, transform: (item: string) => T): T | undefined {
		const item = localStorage.getItem(key) || undefined;
		return item ? transform(item) : undefined;
	}

	private static setItem(key: BrowserStorageKey, value: any) {
		if (value != null) {
			localStorage.setItem(key, value.toString());
		} else {
			localStorage.removeItem(key);
		}
	}

	//

	private _canSkipRegistration = BrowserStorage.getItem(BrowserStorageKey.CAN_SKIP_REGISTRATION) === 'true';

	get canSkipRegistration() {
		return this._canSkipRegistration;
	}

	set canSkipRegistration(value: boolean) {
		BrowserStorage.setItem(BrowserStorageKey.CAN_SKIP_REGISTRATION, value);
		this._canSkipRegistration = value;
	}

	//

	private _quest3 = BrowserStorage.getItem(BrowserStorageKey.QUEST3) !== 'false';

	get quest3() {
		return this._quest3;
	}

	set quest3(value: boolean) {
		BrowserStorage.setItem(BrowserStorageKey.QUEST3, value);
		this._quest3 = value;
	}

	//

	private _feedSourceSettings = BrowserStorage.getItemWithTransform(
		BrowserStorageKey.FEED_SOURCE_SETTINGS,
		item => JSON.parse(item) as FeedSourceSettings,
	);

	get feedSourceSettings() {
		return this._feedSourceSettings;
	}

	set feedSourceSettings(value: FeedSourceSettings | undefined) {
		BrowserStorage.setItem(BrowserStorageKey.FEED_SOURCE_SETTINGS, value && JSON.stringify(value));
		this._feedSourceSettings = value;
	}
}

export const browserStorage = new BrowserStorage();
// @ts-ignore
window.browserStorage = browserStorage;
