import { makeAutoObservable } from 'mobx';

import { WidgetId } from '../pages/widgets/widgets';

// noinspection JSUnusedGlobalSymbols
export enum BrowserStorageKey {
	ADMIN_PASSWORD = 'ylide_adminPassword',
	SAVE_DECODED_MESSAGES = 'ylide_saveDecodedMessages',
	WIDGET_ID = 'ylide_widgetId',
	MAIN_VIEW_KEYS = 'ylide_mainViewKeys',
	LAST_MAILBOX_INCOMING_DATE = 'ylide_lastMailboxCheckDate',
	SAVED_ACCOUNTS = 'ylide_savedAccounts',
	NOTIFICATIONS_ALERT = 'ylide_notificationsAlert',
	REMOTE_CONSOLE = 'ylide_remoteConsole',

	// LEGACY

	IS_MAIN_VIEW_BANNER_HIDDEN = 'ylide_isMainViewBannerHidden',
	COMMUNITY_ADMIN = 'ylide_communityAdmin',
}

export class BrowserStorage {
	constructor() {
		makeAutoObservable(this);
	}

	static getItem<T = string>(key: BrowserStorageKey, storage: Storage = localStorage) {
		return (storage.getItem(key) as T) || undefined;
	}

	static getItemWithTransform<T>(
		key: BrowserStorageKey,
		transform: (item: string) => T,
		storage: Storage = localStorage,
	): T | undefined {
		const item = storage.getItem(key) || undefined;
		return item ? transform(item) : undefined;
	}

	static getJsonItem<T>(key: BrowserStorageKey, storage: Storage = localStorage) {
		return BrowserStorage.getItemWithTransform(key, JSON.parse, storage);
	}

	static setItem(key: BrowserStorageKey, value: string | null | undefined, storage: Storage = localStorage) {
		if (value != null) {
			storage.setItem(key, value);
		} else {
			storage.removeItem(key);
		}
	}

	static setJsonItem<T>(key: BrowserStorageKey, value: T, storage: Storage = localStorage) {
		return BrowserStorage.setItem(key, value != null ? JSON.stringify(value) : null, storage);
	}

	//

	private _adminPassword = BrowserStorage.getItem(BrowserStorageKey.ADMIN_PASSWORD, sessionStorage);

	get adminPassword() {
		return this._adminPassword;
	}

	set adminPassword(value: string | undefined) {
		BrowserStorage.setItem(BrowserStorageKey.ADMIN_PASSWORD, value, sessionStorage);
		this._adminPassword = value;
	}

	get isUserAdmin() {
		return !!this.adminPassword;
	}

	//

	private _saveDecodedMessages = BrowserStorage.getItem(BrowserStorageKey.SAVE_DECODED_MESSAGES) !== 'false';

	get saveDecodedMessages() {
		return this._saveDecodedMessages;
	}

	set saveDecodedMessages(value: boolean) {
		BrowserStorage.setItem(BrowserStorageKey.SAVE_DECODED_MESSAGES, value.toString());
		this._saveDecodedMessages = value;
	}

	//

	private _widgetId = BrowserStorage.getItem<WidgetId>(BrowserStorageKey.WIDGET_ID, sessionStorage);

	get widgetId() {
		return this._widgetId;
	}

	set widgetId(value: WidgetId | undefined) {
		BrowserStorage.setItem(BrowserStorageKey.WIDGET_ID, value, sessionStorage);
		this._widgetId = value;
	}

	//

	private _mainViewKeys: Record<string, string | undefined> =
		BrowserStorage.getJsonItem(BrowserStorageKey.MAIN_VIEW_KEYS) || {};

	get mainViewKeys() {
		return this._mainViewKeys;
	}

	set mainViewKeys(value: Record<string, string | undefined>) {
		BrowserStorage.setJsonItem(BrowserStorageKey.MAIN_VIEW_KEYS, value);
		this._mainViewKeys = value;
	}

	//

	private _lastMailboxCheckDate: Record<string, number> =
		BrowserStorage.getJsonItem(BrowserStorageKey.LAST_MAILBOX_INCOMING_DATE) || {};

	get lastMailboxCheckDate() {
		return this._lastMailboxCheckDate;
	}

	set lastMailboxCheckDate(value: Record<string, number>) {
		BrowserStorage.setJsonItem(BrowserStorageKey.LAST_MAILBOX_INCOMING_DATE, value);
		this._lastMailboxCheckDate = value;
	}
}

export const browserStorage = new BrowserStorage();
// @ts-ignore
window.browserStorage = browserStorage;
