import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DownloadCloud, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateStandardReport } from '@/utils/report-utils';
import { jsPDF } from 'jspdf';
import { ArabicTextService } from '@/utils/arabic-text-service';

interface ReportDownloadOptionsProps {
  reportType: string;
  getReportData: () => any[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

const ReportDownloadOptions: React.FC<ReportDownloadOptionsProps> = ({
  reportType,
  getReportData,
  dateRange = { from: undefined, to: undefined }
}) => {
  const [isLoading, setIsLoading] = useState<{csv: boolean, excel: boolean, pdf: boolean}>({
    csv: false,
    excel: false,
    pdf: false
  });

  // Get date formatted for filenames (YYYY-MM-DD)
  const getFormattedDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  const getReportTitle = () => {
    switch(reportType) {
      case 'fleet': return 'Fleet Analysis Report';
      case 'financial': return 'Financial Performance Report';
      case 'customers': return 'Customer Analytics Report';
      case 'maintenance': return 'Maintenance History Report';
      case 'legal': return 'Legal Cases Summary Report';
      default: return 'Custom Report';
    }
  };

  const handleDownloadCSV = async () => {
    setIsLoading(prev => ({ ...prev, csv: true }));
    try {
      // Import dynamically to reduce initial load time
      const { downloadCSV } = await import('@/utils/report-utils');
      
      const data = getReportData();
      if (!data || data.length === 0) {
        toast.error("No data available to download");
        return;
      }
      
      const fileName = `${reportType}_report_${getFormattedDate()}.csv`;
      downloadCSV(data, fileName);
      toast.success(`CSV export complete for ${reportType} report`);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast.error("Failed to download CSV");
    } finally {
      setIsLoading(prev => ({ ...prev, csv: false }));
    }
  };

  const handleDownloadExcel = async () => {
    setIsLoading(prev => ({ ...prev, excel: true }));
    try {
      // Import dynamically to reduce initial load time
      const { downloadExcel } = await import('@/utils/report-utils');
      
      const data = getReportData();
      if (!data || data.length === 0) {
        toast.error("No data available to download");
        return;
      }
      
      const fileName = `${reportType}_report_${getFormattedDate()}.xlsx`;
      downloadExcel(data, fileName);
      toast.success(`Excel export complete for ${reportType} report`);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel");
    } finally {
      setIsLoading(prev => ({ ...prev, excel: false }));
    }
  };

  const handleDownloadPDF = async () => {
    setIsLoading(prev => ({ ...prev, pdf: true }));
    try {
      const data = getReportData();
      if (!data || data.length === 0) {
        toast.error("No data available to download");
        return;
      }
      
      // Pre-process all text data for Arabic support
      await ArabicTextService.processBatch(
        data.flatMap(item => Object.values(item).filter(val => typeof val === 'string')),
        `PDF ${reportType} report`
      );
      
      const reportTitle = getReportTitle();
      const fileName = `${reportType}_report_${getFormattedDate()}.pdf`;
      
      // Dynamic PDF content generation based on report type
      const doc = await generateStandardReport(reportTitle, dateRange, async (doc, startY) => {
        // This function will be different based on report type
        let y = startY + 10;
        
        // Get column definitions based on first item
        const columns = Object.keys(data[0]).map(key => ({
          key,
          header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
        
        // Process all headers for Arabic text
        const processedHeaders = await Promise.all(
          columns.map(col => ArabicTextService.processText(col.header, 'PDF Report Headers'))
        );
        
        // Add table headers
        doc.setFillColor(240, 240, 240);
        doc.setFont('helvetica', 'bold');
        doc.rect(20, y, doc.internal.pageSize.getWidth() - 40, 10, 'F');
        
        // Calculate column widths
        const columnCount = columns.length;
        const pageWidth = doc.internal.pageSize.getWidth();
        const tableWidth = pageWidth - 40; // 20px margin on each side
        const columnWidth = tableWidth / columnCount;
        
        // Add headers with adjusted positions
        for (let i = 0; i < processedHeaders.length; i++) {
          const x = 20 + (i * columnWidth) + (columnWidth / 2);
          doc.text(processedHeaders[i], x, y + 7, { align: 'center' });
        }
        
        y += 10;
        doc.setFont('helvetica', 'normal');
        
        // Add data rows with alternating colors
        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
          // Add a new page if needed
          if (y > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            y = 20;
            
            // Re-draw header on new page
            doc.setFillColor(240, 240, 240);
            doc.setFont('helvetica', 'bold');
            doc.rect(20, y, doc.internal.pageSize.getWidth() - 40, 10, 'F');
            
            // Add headers with adjusted positions
            for (let i = 0; i < processedHeaders.length; i++) {
              const x = 20 + (i * columnWidth) + (columnWidth / 2);
              doc.text(processedHeaders[i], x, y + 7, { align: 'center' });
            }
            
            y += 10;
            doc.setFont('helvetica', 'normal');
          }
          
          // Alternating row colors
          if (rowIndex % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(20, y, doc.internal.pageSize.getWidth() - 40, 10, 'F');
          }
          
          // Process cell values for Arabic text support
          const rowData = data[rowIndex];
          const cellValues = await Promise.all(
            columns.map(col => {
              const value = rowData[col.key];
              // Convert to string and process if it's a string
              return typeof value === 'string' 
                ? ArabicTextService.processText(value, 'PDF Report Cell') 
                : String(value !== null && value !== undefined ? value : '');
            })
          );
          
          // Add cell values
          for (let colIndex = 0; colIndex < cellValues.length; colIndex++) {
            const x = 20 + (colIndex * columnWidth) + (columnWidth / 2);
            const cellText = cellValues[colIndex];
            
            // Truncate long text
            let displayText = cellText;
            if (displayText.length > 20) {
              displayText = displayText.substring(0, 17) + '...';
            }
            
            doc.text(displayText, x, y + 7, { align: 'center' });
          }
          
          y += 10;
        }
        
        // Add summary
        y += 10;
        doc.setFont('helvetica', 'bold');
        const summaryTitle = await ArabicTextService.processText('Report Summary', 'PDF Report');
        doc.text(summaryTitle, 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        const totalRecords = await ArabicTextService.processText(`Total Records: ${data.length}`, 'PDF Report');
        doc.text(totalRecords, 20, y);
        
        return y;
      });
      
      doc.save(fileName);
      toast.success(`PDF export complete for ${reportType} report`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setIsLoading(prev => ({ ...prev, pdf: false }));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <p className="text-sm text-gray-500 mr-2">Export as:</p>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadCSV}
        disabled={isLoading.csv}
        className="flex items-center space-x-1"
      >
        {isLoading.csv ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <DownloadCloud className="h-4 w-4 mr-1" />
        )}
        <span>CSV</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadExcel}
        disabled={isLoading.excel}
        className="flex items-center space-x-1"
      >
        {isLoading.excel ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-1" />
        )}
        <span>Excel</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPDF}
        disabled={isLoading.pdf}
        className="flex items-center space-x-1"
      >
        {isLoading.pdf ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-1" />
        )}
        <span>PDF</span>
      </Button>
    </div>
  );
};

export default ReportDownloadOptions;
