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
		dsn: 'https://4c4f62731ece4b1e9373a5ef48e6ff9b@o4504063808110592.ingest.sentry.io/4504063811452929',
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
