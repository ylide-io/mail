import 'normalize.css';
import 'minireset.css';
import './styles/index.scss';

import { configure, observable } from 'mobx';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { registerServiceWorker, ServiceWorkerUpdateCallback } from './serviceWorkerRegistration';
import { initSentry } from './utils/sentry';

initSentry();

configure({
	enforceActions: 'never',
});

const root = createRoot(document.getElementById('root')!);
const serviceWorkerUpdateCallback = observable.box<ServiceWorkerUpdateCallback | undefined>(undefined);

root.render(
	<BrowserRouter>
		<App serviceWorkerUpdateCallback={serviceWorkerUpdateCallback} />
	</BrowserRouter>,
);

registerServiceWorker({ onUpdateAvailable: sw => serviceWorkerUpdateCallback.set(sw) });
