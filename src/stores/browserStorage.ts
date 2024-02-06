import { makeAutoObservable } from 'mobx';

import { Section } from '../components/genericLayout/sidebar/sidebarMenu';
import { toggleArrayItem } from '../utils/array';

enum BrowserStorageKey {
	ADMIN_PASSWORD = 'ylide_adminPassword',
	IS_MAIN_VIEW_BANNER_HIDDEN = 'ylide_isMainViewBannerHidden',
	ACCOUNT_REMOTE_KEYS = 'ylide_accountRemoteKeys',
	SIDEBAR_FOLDED_SECTIONS = 'ylide_sidebarFoldedSections',
	SAVE_DECODED_MESSAGES = 'ylide_saveDecodedMessages',
	WIDGET_ID = 'ylide_widgetId',
	MAIN_VIEW_ACCOUNTS = 'ylide_mainViewAccounts',
	REFERRER = 'ylide_referrer',
	IS_AUTHORIZED = 'ylide_isAuthorized',
	LAST_MAILBOX_INCOMING_DATE = 'ylide_lastMailboxCheckDate',
	SAVED_ACCOUNTS = 'ylide_savedAccounts',
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

	private _mainviewAccounts =
		BrowserStorage.getItemWithTransform(
			BrowserStorageKey.MAIN_VIEW_ACCOUNTS,
			item => JSON.parse(item) as Record<string, { id: string; token: string } | undefined>,
		) || {};

	get mainviewAccounts() {
		return this._mainviewAccounts;
	}

	set mainviewAccounts(value: Record<string, { id: string; token: string } | undefined>) {
		BrowserStorage.setItem(BrowserStorageKey.MAIN_VIEW_ACCOUNTS, JSON.stringify(value));
		this._mainviewAccounts = value;
	}

	//

	get referrer() {
		return BrowserStorage.getItem(BrowserStorageKey.REFERRER) || '';
	}

	set referrer(value: string) {
		BrowserStorage.setItem(BrowserStorageKey.REFERRER, value);
	}

	//

	get isAuthorized() {
		return BrowserStorage.getItem(BrowserStorageKey.IS_AUTHORIZED) === 'true' || false;
	}

	set isAuthorized(value: boolean) {
		BrowserStorage.setItem(BrowserStorageKey.IS_AUTHORIZED, value ? 'true' : 'false');
	}
}

export const browserStorage = new BrowserStorage();
// @ts-ignore
window.browserStorage = browserStorage;
