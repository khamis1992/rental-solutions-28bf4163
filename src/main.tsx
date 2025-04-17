
import { createRoot } from 'react-dom/client'
import './styles/reset.css';  // Import reset CSS first
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById("root")!).render(<App />);
