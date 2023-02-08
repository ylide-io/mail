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

	//

	private _canSkipRegistration = localStorage.getItem(BrowserStorageKey.CAN_SKIP_REGISTRATION) === 'true';

	get canSkipRegistration() {
		return this._canSkipRegistration;
	}

	set canSkipRegistration(value: boolean) {
		localStorage.setItem(BrowserStorageKey.CAN_SKIP_REGISTRATION, value.toString());
		this._canSkipRegistration = value;
	}

	//

	private _quest3 = localStorage.getItem(BrowserStorageKey.QUEST3) !== 'false';

	get quest3() {
		return this._quest3;
	}

	set quest3(value: boolean) {
		localStorage.setItem(BrowserStorageKey.QUEST3, value.toString());
		this._quest3 = value;
	}

	//

	private _feedSourceSettings: FeedSourceSettings | undefined = localStorage.getItem(
		BrowserStorageKey.FEED_SOURCE_SETTINGS,
	)
		? JSON.parse(localStorage.getItem(BrowserStorageKey.FEED_SOURCE_SETTINGS)!)
		: undefined;

	get feedSourceSettings() {
		return this._feedSourceSettings;
	}

	set feedSourceSettings(value: FeedSourceSettings | undefined) {
		localStorage.setItem(BrowserStorageKey.FEED_SOURCE_SETTINGS, JSON.stringify(value));
		this._feedSourceSettings = value;
	}
}

export const browserStorage = new BrowserStorage();
// @ts-ignore
window.browserStorage = browserStorage;
