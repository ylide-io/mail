import * as Sentry from '@sentry/react';

import packageJson from '../../package.json';
import { ENV_TYPE, EnvType, REACT_APP__CIRCLE_BUILD_NUM, REACT_APP__CIRCLE_SHA1 } from '../env';

Sentry.setTag('CIRCLE_SHA1', REACT_APP__CIRCLE_SHA1);
Sentry.setTag('CIRCLE_BUILD_NUM', REACT_APP__CIRCLE_BUILD_NUM);

export function initSentry() {
	const dsn = 'https://4e8da33932b3e6ec11ad2d95738007ae@o4504063808110592.ingest.sentry.io/4505709214302208';

	if (!dsn || ENV_TYPE === EnvType.LOCAL) return;

	Sentry.init({
		dsn,
		integrations: [new Sentry.BrowserTracing()],
		release: packageJson.version,
		environment: ENV_TYPE,

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
	});
}
