// @ts-ignore
// eslint-disable-next-line
declare module '../../public/Amiri-Regular.js' { const vfs: any; export default { vfs }; }
// @ts-ignore
// eslint-disable-next-line
declare module '../../public/Amiri-Bold.js' { const vfs: any; export default { vfs }; }

import AmiriRegularVFS from '../../public/Amiri-Regular.js';
import AmiriBoldVFS from '../../public/Amiri-Bold.js';

export function setupArabicFonts(pdfMake: any) {
  try {
    // Merge Amiri font VFS into pdfMake.vfs if not already present
    if (AmiriRegularVFS && AmiriRegularVFS.vfs) {
      pdfMake.vfs = { ...pdfMake.vfs, ...AmiriRegularVFS.vfs };
    }
    if (AmiriBoldVFS && AmiriBoldVFS.vfs) {
      pdfMake.vfs = { ...pdfMake.vfs, ...AmiriBoldVFS.vfs };
    }
    // Primary: Amiri font (ideal for Arabic)
    pdfMake.fonts = {
      Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Bold.ttf',
      }
    };
    console.log('✓ Arabic fonts (Amiri) loaded successfully');
    return true;
  } catch (error) {
    console.warn('⚠ Failed to load Amiri fonts, using system fallback');
    // Fallback: Use system fonts
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    return false;
  }
} 