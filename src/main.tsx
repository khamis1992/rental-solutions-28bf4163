import pdfMake from 'pdfmake/build/pdfmake';
// @ts-expect-error: No types for pdfmake/build/vfs_fonts
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;
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
