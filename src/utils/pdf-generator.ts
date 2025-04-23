import { jsPDF } from 'jspdf';

// Web worker for non-blocking document generation
const pdfWorker = new Worker(new URL('./pdf.worker.js', import.meta.url));

export async function generateAgreementPDF(agreementData) {
  // Use a worker to generate PDFs in a separate thread
  return new Promise((resolve, reject) => {
    pdfWorker.postMessage({
      type: 'generate_agreement',
      data: agreementData
    });
    
    pdfWorker.onmessage = (e) => {
      if (e.data.error) {
        reject(new Error(e.data.error));
      } else {
        resolve(e.data.pdf);
      }
    };
    
    pdfWorker.onerror = (e) => {
      reject(e);
    };
  });
}

// Fallback synchronous PDF generation for simple documents
export function generateSimplePDF(data) {
  const doc = new jsPDF();
  
  // Optimize font loading by only including necessary subsets
  doc.setFont('helvetica', 'normal');
  
  // Implement document generation logic
  // ...existing code...
  
  return doc.output('blob');
}

// Memory-efficient template rendering with cached templates
const templateCache = new Map();

export function renderDocumentTemplate(templateName, data) {
  let template = templateCache.get(templateName);
  
  if (!template) {
    // Load template
    template = require(`../templates/${templateName}.js`);
    templateCache.set(templateName, template);
  }
  
  return template(data);
}