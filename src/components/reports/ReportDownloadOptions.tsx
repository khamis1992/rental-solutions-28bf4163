import React, { useState } from 'react';
import { translateArabicName } from '@/utils/translation-utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { 
  addReportHeader, 
  addReportFooter, 
  downloadCSV, 
  downloadExcel, 
  generateStandardReport, 
  generateTrafficFinesReport 
} from '@/utils/report-utils';

interface ReportDownloadOptionsProps {
  reportType: string;
  getReportData?: () => Record<string, any>[];
}

const ReportDownloadOptions = ({ reportType, getReportData = () => [] }: ReportDownloadOptionsProps) => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: new Date()
  });
  const [fileFormat, setFileFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Get data for the report
      let reportData = getReportData();
      
      // Transliterate Arabic names if present
      if (reportData.length > 0 && (reportType === 'customers' || reportType === 'traffic-fines')) {
        const transliteratedData = await Promise.all(reportData.map(async (item) => {
          const updatedItem = { ...item };
          
          // Handle customer names
          if (item.full_name) {
            updatedItem.full_name = await translateArabicName(item.full_name);
          }
          if (item.customerName) {
            updatedItem.customerName = await translateArabicName(item.customerName);
          }
          
          return updatedItem;
        }));
        
        reportData = transliteratedData;
      }
      
      // Format title based on report type
      const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      
      // Generate report based on file format
      if (fileFormat === 'pdf') {
        // Special case for traffic fines report
        if (reportType === 'traffic-fines') {
          const doc = generateTrafficFinesReport(reportData);
          doc.save(`${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } else {
          // Use the standardized report generator for other reports
          const doc = generateStandardReport(
            title,
            dateRange,
            (doc, startY) => {
              // Add content based on report type
              let yPos = startY;
              
              // Add summary section heading
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text('Report Summary:', 14, yPos);
              yPos += 10;
              
              // Add content specific to each report type
              doc.setFontSize(12);
              doc.setFont('helvetica', 'normal');
              
              switch (reportType) {
                case 'fleet':
                  doc.text('• Total Vehicles in Fleet', 20, yPos); yPos += 10;
                  doc.text('• Vehicle Utilization Rate', 20, yPos); yPos += 10;
                  doc.text('• Active Rentals', 20, yPos); yPos += 10;
                  doc.text('• Vehicles in Maintenance', 20, yPos); yPos += 10;
                  doc.text('• Fleet Performance Analysis', 20, yPos); yPos += 10;
                  break;
                case 'financial':
                  doc.text('• Revenue Summary', 20, yPos); yPos += 10;
                  doc.text('• Expense Analysis', 20, yPos); yPos += 10;
                  doc.text('• Profit Margin', 20, yPos); yPos += 10;
                  doc.text('• Financial Projections', 20, yPos); yPos += 10;
                  break;
                case 'customers':
                  doc.text('• Customer Demographics', 20, yPos); yPos += 10;
                  doc.text('• Customer Satisfaction Scores', 20, yPos); yPos += 10;
                  doc.text('• Rental Frequency Analysis', 20, yPos); yPos += 10;
                  doc.text('• Top Customers', 20, yPos); yPos += 10;
                  break;
                case 'maintenance':
                  doc.text('• Maintenance Schedule', 20, yPos); yPos += 10;
                  doc.text('• Maintenance Costs', 20, yPos); yPos += 10;
                  doc.text('• Upcoming Maintenance', 20, yPos); yPos += 10;
                  doc.text('• Maintenance History', 20, yPos); yPos += 10;
                  break;
                default:
                  doc.text('No data available for this report type.', 20, yPos);
              }
              
              return yPos; // Return the final y position
            }
          );
          
          // Save the PDF
          doc.save(`${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        }
      } else if (fileFormat === 'excel') {
        downloadExcel(reportData, `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      } else if (fileFormat === 'csv') {
        downloadCSV(reportData, `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      }
      
      // Show success toast notification
      toast.success("Report downloaded successfully!", {
        description: `Your ${reportType} report has been downloaded.`
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Download failed", {
        description: "There was a problem generating your report. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          
        </div>
        
        <div className="border-t pt-1 mb-2">
          <h3 className="text-lg font-semibold">Report Options</h3>
        </div>
      </div>
      
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? dateRange.to ? <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </> : format(dateRange.from, "LLL dd, y") : <span>Pick a date range</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange as any} onSelect={range => setDateRange(range as any)} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-40">
          <Select value={fileFormat} onValueChange={setFileFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleDownload} disabled={isGenerating}>
          <FileDown className="mr-2 h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Download Report'}
        </Button>
      </div>
      
      <div className="mt-6 pt-4 border-t flex flex-col items-center">
        
      </div>
    </div>
  );
};
export default ReportDownloadOptions;
