// noinspection JSUnresolvedReference

export const NODE_ENV = process.env.NODE_ENV as string | undefined;

export const REACT_APP__FEED_SERVER = process.env.REACT_APP__FEED_SERVER as string | undefined;
export const REACT_APP__FEED_MANAGER = process.env.REACT_APP__FEED_MANAGER as string | undefined;
export const REACT_APP__BLOCKCHAIN_FEED = process.env.REACT_APP__BLOCKCHAIN_FEED as string | undefined;
export const REACT_APP__HUB_VAPID_PUBLIC_KEY = process.env.REACT_APP__HUB_VAPID_PUBLIC_KEY as string | undefined;
export const REACT_APP__PUBLIC_URL = process.env.REACT_APP__PUBLIC_URL as string | undefined;
export const REACT_APP__FEED_PUBLIC_KEY = process.env.REACT_APP__FEED_PUBLIC_KEY as string | undefined;

export enum AppMode {
	HUB = 'HUB',
	OTC = 'OTC',
	MAIN_VIEW = 'MAIN_VIEW',
}

export const REACT_APP__APP_MODE = (process.env.REACT_APP__APP_MODE || AppMode.HUB) as AppMode;

export enum OtcProvider {
	AIRSWAP = 'AIRSWAP',
	ONEINCH = 'ONEINCH',
	PARASWAP = 'PARASWAP',
}

export const REACT_APP__OTC_PROVIDER = (process.env.REACT_APP__OTC_PROVIDER || OtcProvider.AIRSWAP) as OtcProvider;
