import { OtcProvider } from '../../env';
import { ReactComponent as AirSwapSvg } from './logos/airswap.svg';
import { ReactComponent as OneInchSvg } from './logos/oneinch.svg';
import { ReactComponent as ParaSwapSvg } from './logos/paraswap.svg';

export function getOtcProviderLogo(provider: OtcProvider) {
	return {
		[OtcProvider.AIRSWAP]: AirSwapSvg,
		[OtcProvider.ONEINCH]: OneInchSvg,
		[OtcProvider.PARASWAP]: ParaSwapSvg,
	}[provider];
}

export function getOtcProviderUrl(provider: OtcProvider) {
	return {
		[OtcProvider.AIRSWAP]: 'https://trader.airswap.io/',
		[OtcProvider.ONEINCH]: 'https://app.1inch.io/#/1/p2p/WETH/DAI',
		[OtcProvider.PARASWAP]: 'https://app.paraswap.io/#/p2p',
	}[provider];
}
