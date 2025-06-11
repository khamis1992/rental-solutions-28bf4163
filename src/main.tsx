
import pdfMake from 'pdfmake/build/pdfmake';
import { createRoot } from 'react-dom/client';
import ReactDOMLegacy from 'react-dom';
import App from './App.tsx';
import './index.css';

// Configure PDFMake to use built-in browser fonts
(window as any).pdfMake = pdfMake;

// Initialize with proper font configuration for built-in fonts
pdfMake.fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold', 
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const rootElement = document.getElementById('root');
if (rootElement) {
  if (typeof createRoot === 'function') {
    createRoot(rootElement).render(<App />);
  } else {
    ReactDOMLegacy.render(<App />, rootElement);
  }
}
