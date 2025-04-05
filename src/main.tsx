
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Import i18n configuration

// Create a performance mark for initial render
if (performance && performance.mark) {
  performance.mark('app-init-start');
}

createRoot(document.getElementById("root")!).render(<App />);
