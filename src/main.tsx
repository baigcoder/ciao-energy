import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LocaleProvider } from './i18n';
import './styles/base.css';
import './styles/chrome.css';
import './styles/loader.css';
import './styles/home.css';
import './styles/atmosphere.css';
// Product page, bag and shared commerce controls.
import './styles/shop.css';
import './styles/shop-extras.css';
// Pointer layer, countdown, saved items, notices, stores.
import './styles/fx.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </React.StrictMode>
);
