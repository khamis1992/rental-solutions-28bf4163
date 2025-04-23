import { jsPDF } from 'jspdf';

// PDF generation worker to offload intensive tasks to a separate thread
self.onmessage = async function(e) {
  try {
    const { type, data } = e.data;
    
    if (type === 'generate_agreement') {
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: `Rental Agreement - ${data.agreementNumber}`,
        creator: 'Rental Solutions System'
      });
      
      // Generate document sections
      generateHeader(doc, data);
      generateCustomerInfo(doc, data.customer);
      generateVehicleInfo(doc, data.vehicle);
      generateTerms(doc, data);
      generateSignatureArea(doc);
      
      // Convert to blob/base64 to transfer back to main thread
      const pdfOutput = doc.output('datauristring');
      
      self.postMessage({ pdf: pdfOutput });
    }
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};

function generateHeader(doc, data) {
  doc.setFontSize(20);
  doc.text('RENTAL AGREEMENT', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Agreement #: ${data.agreementNumber}`, 105, 30, { align: 'center' });
  doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 105, 40, { align: 'center' });
}

function generateCustomerInfo(doc, customer) {
  // Customer information section
  doc.setFontSize(14);
  doc.text('CUSTOMER INFORMATION', 20, 60);
  doc.setFontSize(10);
  doc.text(`Name: ${customer.fullName}`, 20, 70);
  doc.text(`ID/License: ${customer.licenseNumber}`, 20, 80);
  doc.text(`Phone: ${customer.phone}`, 20, 90);
  doc.text(`Email: ${customer.email}`, 20, 100);
}

function generateVehicleInfo(doc, vehicle) {
  // Vehicle information section
  doc.setFontSize(14);
  doc.text('VEHICLE INFORMATION', 20, 120);
  doc.setFontSize(10);
  doc.text(`Make/Model: ${vehicle.make} ${vehicle.model}`, 20, 130);
  doc.text(`Year: ${vehicle.year}`, 20, 140);
  doc.text(`License Plate: ${vehicle.licensePlate}`, 20, 150);
  doc.text(`VIN: ${vehicle.vin}`, 20, 160);
}

function generateTerms(doc, data) {
  // Terms section
  doc.setFontSize(14);
  doc.text('RENTAL TERMS', 20, 180);
  doc.setFontSize(10);
  doc.text(`Start Date: ${new Date(data.startDate).toLocaleDateString()}`, 20, 190);
  doc.text(`End Date: ${new Date(data.endDate).toLocaleDateString()}`, 20, 200);
  doc.text(`Rate: $${data.rate.toFixed(2)} / ${data.rateType}`, 20, 210);
  doc.text(`Total Amount: $${data.totalAmount.toFixed(2)}`, 20, 220);
}

function generateSignatureArea(doc) {
  // Signature section
  doc.setFontSize(12);
  doc.text('Customer Signature: _______________________', 20, 260);
  doc.text('Agent Signature: _________________________', 20, 280);
}
