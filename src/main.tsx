import { createRoot } from 'react-dom/client';
import ReactDOMLegacy from 'react-dom';
import App from './App.tsx';
import './index.css';

// Initialize monitoring services
import { initializeMonitoring } from './services/monitoring';
import { ErrorBoundary } from './components/error/ErrorBoundary';

// Import payment testing utilities in development
if (import.meta.env.DEV) {
  import('./utils/test-payment-creation.ts');
}

// Initialize monitoring before app starts
initializeMonitoring();

const rootElement = document.getElementById('root');
if (rootElement) {
  if (typeof createRoot === 'function') {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } else {
    ReactDOMLegacy.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>, 
      rootElement
    );
  }
}
