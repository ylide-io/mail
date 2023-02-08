import { makeAutoObservable } from 'mobx';

enum BrowserStorageKey {
	CAN_SKIP_REGISTRATION = 'can_skip_registration',
	QUEST3 = 'quest3',
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
}

export const browserStorage = new BrowserStorage();
// @ts-ignore
window.browserStorage = browserStorage;
