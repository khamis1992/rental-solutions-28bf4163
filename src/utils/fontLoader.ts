
import axios from 'axios';
import { jsPDF } from 'jspdf';

/**
 * Loads Arabic font for PDF generation
 */
export const loadArabicFont = async (): Promise<boolean> => {
  try {
    // Try to load the Amiri font from Google Fonts
    const fontUrl = 'https://fonts.gstatic.com/s/amiri/v17/J7aRnpd8CGxBHpUrtLMS7JNK.ttf';
    
    console.log('Loading Arabic font for PDF generation...');
    
    const response = await axios.get(fontUrl, { responseType: 'arraybuffer' });
    const fontData = response.data;
    
    // Convert ArrayBuffer to Base64
    const fontBase64 = arrayBufferToBase64(fontData);
    
    // Register the font with jsPDF
    const doc = new jsPDF();
    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    
    console.log('Arabic font loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to load Arabic font:', error);
    return false;
  }
};

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}
