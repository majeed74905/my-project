import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/themes.css'; // Import theme variables
import { ThemeProvider } from './theme/ThemeContext';
import AnalyticsTracker from './components/AnalyticsTracker';

import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalyticsTracker />
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
