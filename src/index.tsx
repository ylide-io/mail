import ReactDOM from 'react-dom';
import App from './App';
import { configure } from 'mobx';

import './assets/scss/style.scss';
import './assets/scss/font-awesome/font-awesome.scss';

import 'antd/dist/antd.min.css';

import './index.scss';

import { BrowserRouter } from 'react-router-dom';

configure({
	enforceActions: 'never',
});

ReactDOM.render(
	<BrowserRouter>
		<App />
	</BrowserRouter>,
	document.getElementById('root') as HTMLElement,
);
