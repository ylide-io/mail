import { Uint256, YLIDE_MAIN_FEED_ID } from '@ylide/sdk';

import { AppMode, REACT_APP__APP_MODE } from './env';

export const APP_NAME = {
	[AppMode.HUB]: 'Ylide Social Hub',
	[AppMode.OTC]: 'Ylide OTC',
	[AppMode.MAIN_VIEW]: 'Mainview',
}[REACT_APP__APP_MODE];

export const HUB_FEED_ID = YLIDE_MAIN_FEED_ID;
export const OTC_FEED_ID = '0000000000000000000000000000000000000000000000000000000000000001' as Uint256;
export const VENOM_FEED_ID = '0000000000026e4d30eccc3215dd8f3157d27e23acbdcfe68000000000000004' as Uint256;

export const VENOM_SERVICE_CODE = 6;

export const DASH = '–';
