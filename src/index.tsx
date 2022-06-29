import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

import './assets/scss/style.scss'
import './assets/scss/font-awesome/font-awesome.scss'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <App />
);

reportWebVitals();
