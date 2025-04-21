
/**
 * Utility to load the Amiri Arabic font into jsPDF.
 * 
 * Make sure to supply the base64-encoded font file, or use jsPDF's font tools to convert TTF to base64.
 * Visit: https://raw.githubusercontent.com/MrRio/jsPDF/master/fontconverter/README.md
 * 
 * You need to provide the VFS font file. For a full production system, serve Amiri-Regular.ttf from '/public' and add its Base64 below.
 */

// Include a small subset string for demonstration; replace with your own full base64 TTF file for actual use.
import { jsPDF } from 'jspdf';

export function registerAmiriFont() {
  // Example: This only registers a stub/empty font for demonstration.
  // You MUST replace with the full Base64 string generated for your chosen .ttf file!
  jsPDF.API.addFileToVFS('Amiri-Regular.ttf', '');
  jsPDF.API.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
}
