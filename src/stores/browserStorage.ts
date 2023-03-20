import { makeAutoObservable } from 'mobx';

import { SidebarSection } from '../components/genericLayout/sidebar/sidebarMenu';
import { WidgetId } from '../pages/widgets/widgets';
import { toggleArrayItem } from '../utils/array';

export interface FeedSourceSettings {
	listId: string;
	sourceIds: string[];
}

enum BrowserStorageKey {
	CAN_SKIP_REGISTRATION = 'can_skip_registration',
	QUEST3 = 'quest3',
	FEED_SOURCE_SETTINGS = 'ylide_feedSourceSettings',
	SIDEBAR_FOLDED_SECTIONS = 'ylide_sidebarFoldedSections',
	SAVE_DECODED_MESSAGES = 'ylide_saveDecodedMessages',
	WIDGET_ID = 'ylide_widgetId',
}

class BrowserStorage {
	constructor() {
		makeAutoObservable(this);
	}

	private static getItem(key: BrowserStorageKey, storage: Storage = localStorage) {
		return storage.getItem(key) || undefined;
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

	//

	private _sidebarFoldedSections =
		BrowserStorage.getItemWithTransform(
			BrowserStorageKey.SIDEBAR_FOLDED_SECTIONS,
			item => item.split(',') as SidebarSection[],
		) || [];

	isSidebarSectionFolded(section: SidebarSection) {
		return this._sidebarFoldedSections.includes(section);
	}

	toggleSidebarSectionFolding(section: SidebarSection) {
		const newValue = toggleArrayItem(this._sidebarFoldedSections, section);
		BrowserStorage.setItem(
			BrowserStorageKey.SIDEBAR_FOLDED_SECTIONS,
			newValue.length ? newValue.join(',') : undefined,
		);
		this._sidebarFoldedSections = newValue;
	}

	//

	private _saveDecodedMessages = BrowserStorage.getItem(BrowserStorageKey.SAVE_DECODED_MESSAGES) !== 'false';

	get saveDecodedMessages() {
		return this._saveDecodedMessages;
	}

	set saveDecodedMessages(value: boolean) {
		BrowserStorage.setItem(BrowserStorageKey.SAVE_DECODED_MESSAGES, value);
		this._saveDecodedMessages = value;
	}

	//

	private _widgetId = BrowserStorage.getItem(BrowserStorageKey.WIDGET_ID, sessionStorage) as WidgetId | undefined;

	get widgetId() {
		return this._widgetId;
	}

	set widgetId(value: WidgetId | undefined) {
		BrowserStorage.setItem(BrowserStorageKey.WIDGET_ID, value, sessionStorage);
		this._widgetId = value;
	}
}

export const browserStorage = new BrowserStorage();
// @ts-ignore
window.browserStorage = browserStorage;
