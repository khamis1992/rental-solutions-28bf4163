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
    from: Date | undefined;
    to: Date | undefined;
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
      
      await ArabicTextService.processBatch(
        data.flatMap(item => Object.values(item).filter(val => typeof val === 'string')),
        `PDF ${reportType} report`
      );
      
      const reportTitle = getReportTitle();
      const fileName = `${reportType}_report_${getFormattedDate()}.pdf`;
      
      const doc = await generateStandardReport(reportTitle, {
        from: dateRange?.from || new Date(),
        to: dateRange?.to || new Date()
      }, async (doc, startY) => {
        let y = startY + 10;
        
        const columns = Object.keys(data[0]).map(key => ({
          key,
          header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
        
        const processedHeaders = await Promise.all(
          columns.map(col => ArabicTextService.processText(col.header, 'PDF Report Headers'))
        );
        
        doc.setFillColor(240, 240, 240);
        doc.setFont('helvetica', 'bold');
        doc.rect(20, y, doc.internal.pageSize.getWidth() - 40, 10, 'F');
        
        const columnCount = columns.length;
        const pageWidth = doc.internal.pageSize.getWidth();
        const tableWidth = pageWidth - 40;
        const columnWidth = tableWidth / columnCount;
        
        for (let i = 0; i < processedHeaders.length; i++) {
          const x = 20 + (i * columnWidth) + (columnWidth / 2);
          doc.text(processedHeaders[i], x, y + 7, { align: 'center' });
        }
        
        y += 10;
        doc.setFont('helvetica', 'normal');
        
        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
          if (y > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            y = 20;
            
            doc.setFillColor(240, 240, 240);
            doc.setFont('helvetica', 'bold');
            doc.rect(20, y, doc.internal.pageSize.getWidth() - 40, 10, 'F');
            
            for (let i = 0; i < processedHeaders.length; i++) {
              const x = 20 + (i * columnWidth) + (columnWidth / 2);
              doc.text(processedHeaders[i], x, y + 7, { align: 'center' });
            }
            
            y += 10;
            doc.setFont('helvetica', 'normal');
          }
          
          if (rowIndex % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(20, y, doc.internal.pageSize.getWidth() - 40, 10, 'F');
          }
          
          const rowData = data[rowIndex];
          const cellValues = await Promise.all(
            columns.map(col => {
              const value = rowData[col.key];
              return typeof value === 'string' 
                ? ArabicTextService.processText(value, 'PDF Report Cell') 
                : String(value !== null && value !== undefined ? value : '');
            })
          );
          
          for (let colIndex = 0; colIndex < cellValues.length; colIndex++) {
            const x = 20 + (colIndex * columnWidth) + (columnWidth / 2);
            const cellText = cellValues[colIndex];
            
            let displayText = cellText;
            if (displayText.length > 20) {
              displayText = displayText.substring(0, 17) + '...';
            }
            
            doc.text(displayText, x, y + 7, { align: 'center' });
          }
          
          y += 10;
        }
        
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
