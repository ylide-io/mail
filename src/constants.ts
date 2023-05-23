import { Uint256 } from '@ylide/sdk';

import { AppMode, REACT_APP__APP_MODE } from './env';

export const APP_NAME = {
	[AppMode.HUB]: 'Ylide Social Hub',
	[AppMode.OTC]: 'Ylide OTC',
	[AppMode.MAIN_VIEW]: 'MainView',
}[REACT_APP__APP_MODE];

export const OTC_FEED_ID = '0000000000000000000000000000000000000000000000000000000000000001' as Uint256;
export const VENOM_FEED_ID = '0000000000000000000000000000000000000000000000000000000000000004' as Uint256;
