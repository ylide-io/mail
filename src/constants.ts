import { AppMode, REACT_APP__APP_MODE } from './env';

export const APP_NAME = {
	[AppMode.HUB]: 'Ylide Social Hub',
	[AppMode.OTC]: 'Ylide OTC',
	[AppMode.MAIN_VIEW]: 'MainView',
}[REACT_APP__APP_MODE];
