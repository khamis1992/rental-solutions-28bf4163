
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  downloadCSV, 
  downloadExcel, 
  generateStandardReport,
  renderText
} from '@/utils/report-utils';
import { DateRange } from '@/components/ui/date-range-picker';
import { toast } from 'sonner';
import { FileDown } from 'lucide-react';

interface ReportDownloadOptionsProps {
  reportType: string;
  getReportData: () => Record<string, any>[];
  dateRange?: DateRange;
}

function getCurrentArabicDate() {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return formatter.format(date);
}

const ReportDownloadOptions: React.FC<ReportDownloadOptionsProps> = ({
  reportType,
  getReportData,
  dateRange
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (format: 'pdf' | 'csv' | 'excel') => {
    setIsGenerating(true);
    try {
      const data = getReportData();
      const currentDate = new Date();
      const fileName = `${reportType}_report_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}_${currentDate.getDate()}`;

      if (format === 'csv') {
        downloadCSV(data, `${fileName}.csv`);
      } else if (format === 'excel') {
        downloadExcel(data, `${fileName}.xlsx`);
      } else if (format === 'pdf') {
        const doc = await generateStandardReport(
          `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report تقرير`,
          { from: dateRange?.from, to: dateRange?.to },
          (doc, startY) => {
            // PDF header
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            let y = startY;

            // Add a subtitle in Arabic 
            renderText(doc, `تقرير ${reportType} - ${getCurrentArabicDate()}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
            y += 10;

            // Check if we have data
            if (!data || data.length === 0) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(12);
              doc.setTextColor(100, 100, 100);
              renderText(doc, 'No data available for this report.', doc.internal.pageSize.getWidth() / 2, y + 30, { align: 'center' });
              return y + 50;
            }

            // Generate table headers
            const headers = Object.keys(data[0]);
            doc.setFillColor(240, 240, 240);
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 8, 'FD');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(44, 62, 80);
            const colWidth = (doc.internal.pageSize.getWidth() - 30) / headers.length;
            
            headers.forEach((header, i) => {
              const header_x = 15 + (colWidth * i) + (colWidth / 2);
              doc.text(header.replace(/_/g, ' ').toUpperCase(), header_x, y + 5, { align: 'center' });
            });
            
            y += 8;
            
            // Generate table rows (limited to prevent performance issues)
            const displayData = data.slice(0, Math.min(data.length, 100));
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            
            let alternateRow = false;
            displayData.forEach((row) => {
              if (y > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20;
              }
              
              if (alternateRow) {
                doc.setFillColor(248, 248, 248);
                doc.rect(15, y, doc.internal.pageSize.getWidth() - 30, 6, 'F');
              }
              
              headers.forEach((header, i) => {
                let cellValue = row[header];
                
                // Format date values
                if (cellValue instanceof Date && !isNaN(cellValue.getTime())) {
                  cellValue = cellValue.toLocaleDateString();
                } else if (cellValue === null || cellValue === undefined) {
                  cellValue = '-';
                }
                
                const cell_x = 15 + (colWidth * i) + (colWidth / 2);
                renderText(doc, String(cellValue), cell_x, y + 4, { align: 'center' });
              });
              
              y += 6;
              alternateRow = !alternateRow;
            });
            
            return y;
          }
        );
        
        doc.save(`${fileName}.pdf`);
      }
      
      toast.success(`Report successfully downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center"
          disabled={isGenerating}
        >
          <FileDown className="h-4 w-4 mr-1" />
          {isGenerating ? 'Generating...' : 'Download'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload('pdf')}>
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('csv')}>
          Download as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('excel')}>
          Download as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReportDownloadOptions;
