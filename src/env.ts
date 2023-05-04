import { OtcProvider } from './pages/otc/otc';

export const REACT_APP__FEED_SERVER = process.env.REACT_APP__FEED_SERVER;

export const REACT_APP__OTC_MODE = !!process.env.REACT_APP__OTC_MODE;
export const REACT_APP__OTC_PROVIDER = (process.env.REACT_APP__OTC_PROVIDER as OtcProvider) || OtcProvider.AIRSWAP;

export const REACT_APP__SMART_FEED_MODE = !!process.env.REACT_APP__SMART_FEED_MODE;
