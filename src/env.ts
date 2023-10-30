// noinspection JSUnresolvedReference

import { invariant } from './utils/assert';

function env(name: string, params?: { optional: boolean }) {
	const value = (process.env[name] as string) || '';

	if (!params?.optional) {
		invariant(value, `ENV var ${name} not provided`);
	}

	return value;
}

//

export const NODE_ENV = env('NODE_ENV');

export const REACT_APP__PUBLIC_URL = env('REACT_APP__PUBLIC_URL');
export const REACT_APP__CIRCLE_SHA1 = env('REACT_APP__CIRCLE_SHA1', { optional: true });

export enum AppMode {
	HUB = 'HUB',
	OTC = 'OTC',
	MAIN_VIEW = 'MAIN_VIEW',
}

export const REACT_APP__APP_MODE = env('REACT_APP__APP_MODE') as AppMode;

export const REACT_APP__FEED_SERVER = env('REACT_APP__FEED_SERVER', { optional: true });
export const REACT_APP__FEED_MANAGER = env('REACT_APP__FEED_MANAGER');
export const REACT_APP__BLOCKCHAIN_FEED = env('REACT_APP__BLOCKCHAIN_FEED', { optional: true });

export const REACT_APP__MV_PUBLIC_KEY = env('REACT_APP__MV_PUBLIC_KEY');
export const REACT_APP__VAPID_PUBLIC_KEY = env('REACT_APP__VAPID_PUBLIC_KEY', { optional: true });

export enum OtcProvider {
	AIRSWAP = 'AIRSWAP',
	ONEINCH = 'ONEINCH',
	PARASWAP = 'PARASWAP',
}

export const REACT_APP__OTC_PROVIDER = env('REACT_APP__OTC_PROVIDER') as OtcProvider;

console.log('App version', REACT_APP__CIRCLE_SHA1);
