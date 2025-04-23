const PDFDocument = require('pdfkit');

function generateTrafficFineReport(data) {
  const doc = new PDFDocument({
    size: 'A4',
    info: {
      Producer: 'Rental Solutions',
      Creator: 'Rental Solutions',
      Title: 'Traffic Fine Report',
      encoding: 'UTF-8'
    }
  });
  
  // Register a font that supports Arabic characters
  doc.registerFont('Arabic', 'path/to/arabic-font.ttf');
  doc.font('Arabic');
  
  // Add right-to-left text direction for Arabic
  doc.text(data.arabicText, {
    features: ['rtla']  // Right-to-left Arabic
  });
  
  // ...existing code...
}

module.exports = generateTrafficFineReport;