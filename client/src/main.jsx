import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const container = document.getElementById('root');

if (!container) {
  throw new Error(
    '[ShopEZ] Root element #root not found in index.html. ' +
    'Make sure the element exists before the script runs.'
  );
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
