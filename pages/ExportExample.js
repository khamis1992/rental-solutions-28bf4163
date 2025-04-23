
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportToPdfWithArabic, createArabicText, exportMixedDirectionPdf } from '../utils/pdfExport';
import { toast } from 'sonner';

const ExportExample = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      console.log("Starting PDF export with Arabic support");
      
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
        console.log("PDF export completed successfully");
        toast.success('PDF exported successfully');
      } else {
        console.error("PDF export failed");
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Export Report</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4">Arabic PDF Export Example</h2>
          <p className="text-gray-600 mb-4">
            This example demonstrates generating a PDF document with Arabic text support.
            The PDF includes RTL text formatting and proper font rendering for Arabic characters.
          </p>
          <Button 
            onClick={handleExport} 
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Export PDF with Arabic Support'}
          </Button>
        </div>
        
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
          <p className="text-amber-700">
            Note: If the export fails, please check the browser console for detailed error messages.
            Font rendering issues may occur in some environments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportExample;
