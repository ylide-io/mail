import 'normalize.css';
import 'minireset.css';
import './styles/index.scss';

import { configure } from 'mobx';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { initSentry } from './utils/sentry';

initSentry();

configure({
	enforceActions: 'never',
});

const root = createRoot(document.getElementById('root')!);

root.render(
	<BrowserRouter>
		<App />
	</BrowserRouter>,
);
