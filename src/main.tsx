import pdfMake from 'pdfmake/build/pdfmake';
(window as any).pdfMake = pdfMake;
(window as any).pdfMake.vfs = {};
import { createRoot } from 'react-dom/client';
import ReactDOMLegacy from 'react-dom';
import App from './App.tsx';
import './index.css';

// Initialize monitoring services
import { initializeMonitoring } from './services/monitoring';
import { ErrorBoundary } from './components/error/ErrorBoundary';

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
