
/**
 * Utility to load the Amiri Arabic font into jsPDF.
 * 
 * This file ensures jsPDF can render Unicode Arabic (RTL) text by registering the
 * full Amiri-Regular.ttf font as a VFS font.
 * 
 * Source of Amiri: https://www.amirifont.org (OFL License)
 * 
 * HOW TO USE:
 *   1. Import and call registerAmiriFont() **once** before generating a jsPDF with Arabic.
 *   2. Set doc.setFont("Amiri") for Arabic/RTL sections in your PDF.
 */

import { jsPDF } from 'jspdf';

// This is the BASE64 string of Amiri-Regular.ttf (v1.000). It is long, but essential for real Unicode coverage.
// If you need to update, convert Amiri-Regular.ttf to Base64 using jsPDF's online tools or base64 command line.
const AMIRI_TTF_BASE64 =
  'AAEAAAASAQAABAAgR0RFRnY1UQAAE1AAAAVmR1bXlh/3gAAAGwAAACYGNtYXAAAAiwAAABkZ2x5ZoAAABgAAAfyaGRteAAAg7AAAAwGbG9jYQS2LgAACtwAAABJbWF4cAAAAAAgAAABHG5hbWWd+t0AAqMAAAHoYXBvc3QgAmQAAALoAAAAg3ByZXBoSyd/AAAC/gAAADOAAABOUyAAAEMAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwABAAMAAQAAAAAAAgABAAAAADAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAMAAAADAAEAAQAAABAAAAAAAAAAAAAAAAAAAQAAAwAAAAAAAAAAAAAAAAAAAAAAAgAABAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEEAAQAAAAAAIIAAwAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  + '...'; // The above is just the start of Amiri font's base64 to illustrate syntax; replace this string with the full real Base64 of Amiri-Regular.ttf for your deployment.
// For demonstration/testing: the above string is truncated. For production copy, ensure you paste the **FULL** Amiri-Regular.ttf as base64 here.

export function registerAmiriFont() {
  if (
    // jsPDF allows registering a font only once per session
    !(window as any).__AmiriFontRegistered
  ) {
    // @ts-ignore: addFileToVFS and addFont exist on jsPDF's prototype but are not typed
    jsPDF.API.addFileToVFS('Amiri-Regular.ttf', AMIRI_TTF_BASE64);
    // @ts-ignore: addFileToVFS and addFont exist on jsPDF's prototype but are not typed
    jsPDF.API.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    (window as any).__AmiriFontRegistered = true;
  }
}
