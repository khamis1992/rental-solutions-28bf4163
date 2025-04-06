
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { generateStandardReport } from '@/utils/report-utils';
import { generateCSV, downloadCSV, downloadExcel } from '@/utils/report-utils';
import { toast } from 'sonner';
import { generateTrafficFinesCSV, generateTrafficFinesPDF } from '@/utils/traffic-fines-report-utils';
import { useTrafficFines } from '@/hooks/use-traffic-fines';

interface ReportDownloadOptionsProps {
  reportType: string;
  getReportData: () => Record<string, any>[];
  reportTitle?: string;
  dateRange?: { from: Date; to: Date };
}

const ReportDownloadOptions = ({ 
  reportType, 
  getReportData,
  reportTitle,
  dateRange 
}: ReportDownloadOptionsProps) => {
  const { trafficFines } = useTrafficFines();
  const [isGenerating, setIsGenerating] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  const handleDownloadCSV = async () => {
    try {
      setIsGenerating('csv');
      let csvData: string;
      let filename: string;

      // Use specialized CSV generators for specific report types
      if (reportType === 'traffic-fines' && trafficFines) {
        // Only include customer-assigned fines for traffic fines reports
        csvData = generateTrafficFinesCSV(trafficFines);
        filename = `traffic-fines-report-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        const data = getReportData();
        csvData = generateCSV(data);
        filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      }

      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV report downloaded successfully');
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error('Failed to generate CSV report');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setIsGenerating('excel');
      // For now, we just use the CSV format with .xlsx extension
      // In a production app, you might want to use a library like xlsx
      const data = getReportData();
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      downloadExcel(data, filename);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error('Failed to generate Excel report');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating('pdf');
      toast.info('Generating PDF report...', { duration: 2000 });

      let doc;
      let filename: string;

      // Use specialized PDF generators for specific report types
      if (reportType === 'traffic-fines' && trafficFines) {
        // Generate traffic fines PDF - now filtering for customer-assigned fines is done within this function
        doc = await generateTrafficFinesPDF(trafficFines);
        filename = `traffic-fines-report-${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        // Use standard report generator for other report types
        const title = reportTitle || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
        const reportDateRange = dateRange || { 
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
          to: new Date() 
        };
        
        doc = await generateStandardReport(
          title,
          reportDateRange,
          async (doc, startY) => {
            let y = startY + 10;
            
            // Add report-specific content here based on reportType
            doc.setFontSize(12);
            doc.text(`${reportType.toUpperCase()} REPORT CONTENT`, 14, y);
            
            return y + 20; // Return the new Y position
          }
        );
        filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      }

      // Download the PDF
      doc.save(filename);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Button 
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={handleDownloadCSV}
        disabled={isGenerating !== null}
      >
        {isGenerating === 'csv' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        <span>CSV</span>
      </Button>
      
      <Button 
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={handleDownloadExcel}
        disabled={isGenerating !== null}
      >
        {isGenerating === 'excel' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-2" />
        )}
        <span>Excel</span>
      </Button>
      
      <Button 
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={handleDownloadPDF}
        disabled={isGenerating !== null}
      >
        {isGenerating === 'pdf' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        <span>PDF</span>
      </Button>
    </div>
  );
};

export default ReportDownloadOptions;
