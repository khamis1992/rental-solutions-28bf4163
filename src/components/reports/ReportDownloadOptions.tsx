
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { generateStandardReport } from '@/utils/report-utils';
import { generateCSV, downloadCSV, downloadExcel } from '@/utils/report-utils';
import { toast } from 'sonner';
import { generateTrafficFinesCSV, generateTrafficFinesPDF } from '@/utils/traffic-fines-report-utils';
import { useTrafficFines } from '@/hooks/use-traffic-fines';

interface ReportDownloadOptionsProps {
  reportType: string;
  getReportData: () => Record<string, any>[];
}

const ReportDownloadOptions = ({ 
  reportType, 
  getReportData 
}: ReportDownloadOptionsProps) => {
  const { trafficFines } = useTrafficFines();

  const handleDownloadCSV = () => {
    try {
      let csvData: string;
      let filename: string;

      // Use specialized CSV generators for specific report types
      if (reportType === 'traffic-fines' && trafficFines) {
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
    }
  };

  const handleDownloadExcel = () => {
    try {
      // For now, we just use the CSV format with .xlsx extension
      // In a production app, you might want to use a library like xlsx
      const data = getReportData();
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      downloadExcel(data, filename);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error('Failed to generate Excel report');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('Generating PDF report...', { duration: 2000 });

      let doc;
      let filename: string;

      // Use specialized PDF generators for specific report types
      if (reportType === 'traffic-fines' && trafficFines) {
        doc = await generateTrafficFinesPDF(trafficFines);
        filename = `traffic-fines-report-${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        // Use standard report generator for other report types
        doc = await generateStandardReport(
          `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
          { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
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
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Button 
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={handleDownloadCSV}
      >
        <FileText className="h-4 w-4 mr-2" />
        <span>CSV</span>
      </Button>
      
      <Button 
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={handleDownloadExcel}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        <span>Excel</span>
      </Button>
      
      <Button 
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={handleDownloadPDF}
      >
        <Download className="h-4 w-4 mr-2" />
        <span>PDF</span>
      </Button>
    </div>
  );
};

export default ReportDownloadOptions;
