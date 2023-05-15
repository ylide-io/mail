export const REACT_APP__FEED_SERVER = process.env.REACT_APP__FEED_SERVER as string | undefined;

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
