import 'normalize.css';
import 'minireset.css';
import './styles/index.scss';

import { configure } from 'mobx';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { registerServiceWorker } from './serviceWorkerRegistration';
import { initSentry } from './utils/sentry';
import { buildUrl, UseNavParameters } from './utils/url';

initSentry();

configure({
	enforceActions: 'never',
});

function migrateLocation() {
	function navigate(params: UseNavParameters) {
		location.replace(
			buildUrl({
				path: location.pathname,
				search: location.search,
				hash: location.hash,
				...params,
			}),
		);
	}

	function rule(regex: string | RegExp, transform: (pathname: string, match: RegExpMatchArray) => string) {
		const match = location.pathname.match(regex);
		if (match) {
			navigate({
				path: transform(location.pathname, match),
			});

			return true;
		}
	}

	return (
		// remove trailing slash
		rule(/.+\/+$/, pathname => pathname.replace(/\/+$/, '')) ||
		// venom communities
		rule(/\/feed\/venom\/(.+)/i, (_, match) => `/feed/project/${match[1]}`) ||
		// TVM project
		rule(/\/feed\/tvm\/(.+)/i, () => '/feed/project/tvm') ||
		// old addresses were starting from /feed
		rule(/\/feed\/project\/(.+)/i, (_, match) => `/project/${match[1]}`) ||
		// first descussion feed
		rule('/project/tvm_discussion', () => '/project/tvm/discussion') ||
		// old post URLs
		rule(/\/project\/(.+?)\/(discussion|announcements)\/post\/(.+)/, (_, match) => `/post/${match[3]}`) ||
		// incorrectly named communities
		rule(/\/project\/znsConnect(.*)/, (_, match) => `/project/zns_connect${match[1]}`) ||
		rule(/\/project\/cosmosChickenCoop(.*)/, (_, match) => `/project/cosmos_chicken_coop${match[1]}`) ||
		rule(/\/project\/eddyFinance(.*)/, (_, match) => `/project/eddy_finance${match[1]}`) ||
		rule(/\/project\/sleekWallet(.*)/, (_, match) => `/project/sleek_wallet${match[1]}`)
	);
}

if (!migrateLocation()) {
	const root = createRoot(document.getElementById('root')!);

	root.render(
		<BrowserRouter>
			<App />
		</BrowserRouter>,
	);

	registerServiceWorker();
}
