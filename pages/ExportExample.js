import React from 'react';
import { Button } from 'your-ui-library'; // Replace with your actual UI library
import { exportToPdfWithArabic, createArabicText } from '../utils/pdfExport';

const ExportExample = () => {
  const handleExport = () => {
    // Sample document with Arabic content
    const documentContent = [
      // Regular Latin text
      { text: 'Rental Solutions Report', style: 'header' },
      
      // Arabic text with proper RTL support
      createArabicText('تقرير حلول الإيجار', { style: 'header' }),
      
      // Mixed content example
      {
        columns: [
          createArabicText('المستأجر: أحمد محمد'),
          { text: 'Date: 2023-08-15', alignment: 'left' }
        ]
      },
      
      // More Arabic content
      createArabicText('تفاصيل العقار', { style: 'subheader' }),
      createArabicText('موقع: شارع الملك فهد، الرياض'),
      createArabicText('رقم الوحدة: 304'),
      createArabicText('القيمة الإيجارية: ٥٠٠٠ ريال سعودي')
    ];
    
    exportToPdfWithArabic(documentContent, 'rental-report.pdf');
  };

  return (
    <div>
      <h1>Export Report</h1>
      <Button onClick={handleExport}>Export PDF with Arabic Support</Button>
    </div>
  );
};

export default ExportExample;
