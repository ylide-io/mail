import * as Sentry from '@sentry/react';
import { customAlphabet } from 'nanoid';

import packageJson from '../../package.json';
import { AppMode, REACT_APP__APP_MODE } from '../env';

export function initSentry() {
	const dsn = {
		[AppMode.HUB]: 'https://4c4f62731ece4b1e9373a5ef48e6ff9b@o4504063808110592.ingest.sentry.io/4504063811452929',
		[AppMode.MAIN_VIEW]:
			'https://4e8da33932b3e6ec11ad2d95738007ae@o4504063808110592.ingest.sentry.io/4505709214302208',
		[AppMode.OTC]: '',
	}[REACT_APP__APP_MODE];

	if (!dsn) return;

	const hostname = document.location.hostname;
	const environment = ['hub.ylide.io', 'app.mainview.io'].includes(hostname)
		? 'production'
		: ['staging.ylide.io', 'staging.mainview.io'].includes(hostname)
		? 'staging'
		: 'local';

	if (environment === 'local') return;

	Sentry.init({
		dsn,
		integrations: [new Sentry.BrowserTracing()],
		release: packageJson.version,
		environment,

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
	});
}

export function captureSentryExceptionWithId(message: unknown, cause?: unknown) {
	cause != null && console.error(cause);

	const id = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
	const error = new Error(`${id}: ${message}`);
	console.error(error);
	Sentry.captureException(error);
	return id;
}
