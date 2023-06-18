import 'normalize.css';
import 'minireset.css';
import './styles/index.scss';

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { configure } from 'mobx';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import packageJson from '../package.json';
import App from './App';
// import { startRemoteConsole } from './utils/startRemoteConsole';

// let isRemoteSessionActive = false;
// let touchesDone = 0;
// let firstTouchTime = 0;
// window.addEventListener('touchstart', e => {
// 	if (!isRemoteSessionActive && e.touches.length === 3) {
// 		if (touchesDone === 0) {
// 			firstTouchTime = Date.now();
// 		}
// 		touchesDone++;
// 		if (touchesDone === 5) {
// 			if (Date.now() - firstTouchTime < 5000) {
// 				isRemoteSessionActive = true;
// 				const channelName = startRemoteConsole();
// 				alert('Channel name: ' + channelName);
// 			}
// 			touchesDone = 0;
// 		}
// 	}
// });

if (document.location.hostname !== 'localhost') {
	Sentry.init({
		dsn: 'https://4c4f62731ece4b1e9373a5ef48e6ff9b@o4504063808110592.ingest.sentry.io/4504063811452929',
		integrations: [new BrowserTracing()],
		release: packageJson.version,
		environment: document.location.hostname === 'mail.ylide.io' ? 'production' : 'local',

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
	});
}

configure({
	enforceActions: 'never',
});

ReactDOM.render(
	<BrowserRouter>
		<App />
	</BrowserRouter>,
	document.getElementById('root') as HTMLElement,
);
