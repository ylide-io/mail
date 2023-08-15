import 'normalize.css';
import 'minireset.css';
import './styles/index.scss';

import * as Sentry from '@sentry/react';
import { configure } from 'mobx';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import packageJson from '../package.json';
import { App } from './App';

if (document.location.hostname !== 'localhost') {
	Sentry.init({
		dsn: 'https://4e8da33932b3e6ec11ad2d95738007ae@o4504063808110592.ingest.sentry.io/4505709214302208',
		integrations: [new Sentry.BrowserTracing()],
		release: packageJson.version,
		environment: ['hub.ylide.io', 'app.mainview.io'].includes(document.location.hostname)
			? 'production'
			: ['staging.ylide.io'].includes(document.location.hostname)
			? 'staging'
			: 'local',

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
	});
}

configure({
	enforceActions: 'never',
});

const root = createRoot(document.getElementById('root')!);

root.render(
	<BrowserRouter>
		<App />
	</BrowserRouter>,
);
