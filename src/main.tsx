
import pdfMake from 'pdfmake/build/pdfmake';
(window as any).pdfMake = pdfMake;
(window as any).pdfMake.vfs = {};
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
