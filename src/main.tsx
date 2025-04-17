
// Import polyfills first
import './polyfills';

import { createRoot } from 'react-dom/client';
import './styles/reset.css';  // Import reset CSS first
import './index.css';
import App from './App.tsx';

// Ensure the DOM is ready before rendering
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  } else {
    console.error("Root element not found");
  }
});
