
import React, { useState } from 'react';
import { Button } from 'your-ui-library'; // Replace with your actual UI library
import { exportToPdfWithArabic, createArabicText, exportMixedDirectionPdf } from '../utils/pdfExport';
import { toast } from 'sonner'; // Assuming you're using sonner for toasts

const ExportExample = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      
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
      
      const success = exportToPdfWithArabic(documentContent, 'rental-report.pdf');
      
      if (success) {
        toast.success('PDF exported successfully');
      } else {
        toast.error('Failed to export PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(`Failed to export PDF: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h1>Export Report</h1>
      <Button 
        onClick={handleExport} 
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Export PDF with Arabic Support'}
      </Button>
    </div>
  );
};

export default ExportExample;
