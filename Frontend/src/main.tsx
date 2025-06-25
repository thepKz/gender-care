import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import App from './App';
import { store } from './redux/store';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider store={store}>
    <BrowserRouter>
      <AntdApp>
        <App />
      </AntdApp>
    </BrowserRouter>
  </Provider>
); 