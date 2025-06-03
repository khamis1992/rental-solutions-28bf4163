import pdfMake from 'pdfmake/build/pdfmake';
(window as any).pdfMake = pdfMake;
import { createRoot } from 'react-dom/client';
import ReactDOMLegacy from 'react-dom';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  if (typeof createRoot === 'function') {
    createRoot(rootElement).render(<App />);
  } else {
    ReactDOMLegacy.render(<App />, rootElement);
  }
}
