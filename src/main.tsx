import { createRoot } from 'react-dom/client';
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

// PWA Install Helper - DISABLED
const initPWAFeatures = () => {
  console.log('[PWA] PWA features disabled');
  // PWA functionality has been disabled to remove installation prompts
  return;
};

// Global PWA install function - DISABLED
(window as any).installPWA = async () => {
  console.log('PWA installation is disabled');
  return false;
};

// Initialize app
const initApp = async () => {
  // Initialize PWA features (service worker handled by Vite PWA plugin)
  initPWAFeatures();
  
  // Mount React app
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<ErrorBoundary>
      <App />
    </ErrorBoundary>);
  }
};

// Start the app
initApp(); 