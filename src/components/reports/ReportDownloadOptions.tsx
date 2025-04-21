
import React, { useState } from 'react';
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
  generateTrafficFinesReport,
  addBilingualText
} from '@/utils/report-utils';
import { testArabicSupport, registerArabicSupport } from '@/utils/jspdf-arabic-font';

interface ReportDownloadOptionsProps {
  reportType: string;
  getReportData?: () => Record<string, any>[];
}

const ReportDownloadOptions = ({
  reportType,
  getReportData = () => []
}: ReportDownloadOptionsProps) => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: new Date()
  });
  const [fileFormat, setFileFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isArabic, setIsArabic] = useState(false);

  // Skip PDF generation for traffic fines as we're using our custom component
  const isTrafficFinesPdf = fileFormat === 'pdf' && reportType === 'traffic-fines';

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Get data for the report
      const reportData = getReportData ? getReportData() : [];
      
      if (!reportData || reportData.length === 0) {
        toast.warning("No data available", {
          description: "There is no data available for this report."
        });
        setIsGenerating(false);
        return;
      }
      
      // Format title based on report type
      const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      
      // Arabic title equivalents
      const arabicTitles: Record<string, string> = {
        'fleet': 'تقرير الأسطول',
        'financial': 'التقرير المالي',
        'customers': 'تقرير العملاء',
        'maintenance': 'تقرير الصيانة',
        'legal': 'التقرير القانوني',
        'traffic-fines': 'تقرير المخالفات المرورية'
      };
      
      // Skip PDF generation for traffic fines as we have a specialized component
      if (isTrafficFinesPdf) {
        setIsGenerating(false);
        toast.info("Use the dedicated PDF download button for Traffic Fines");
        return;
      }
      
      if (fileFormat === 'pdf') {
        try {
          console.log(`Generating ${reportType} PDF report with ${reportData.length} records`);
          
          // First, try a simple test document to see if Arabic is supported
          if (isArabic) {
            console.log("Testing Arabic text support in PDF...");
            const testDoc = new jsPDF();
            registerArabicSupport(testDoc);
            const arabicSupported = testArabicSupport(testDoc);
            console.log("Arabic support test:", arabicSupported ? "Passed" : "Failed");
          }
          
          // Use the standardized report generator for reports
          try {
            const doc = generateStandardReport(
              title,
              dateRange,
              (doc, startY) => {
                // Add basic content without font issues
                let yPos = startY;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Report Summary:', 14, yPos);
                
                if (isArabic) {
                  // Add Arabic title below English title using our bilingual text helper
                  const arabicTitle = arabicTitles[reportType] || 'تقرير';
                  yPos = addBilingualText(doc, 'Report Summary:', arabicTitle, 14, yPos + 10);
                } else {
                  yPos += 10;
                }
                
                // Add simple content based on report type
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                
                // Add report-specific content
                switch(reportType) {
                  case 'fleet':
                    doc.text('• Total Vehicles in Fleet', 20, yPos); yPos += 10;
                    doc.text('• Vehicle Utilization Rate', 20, yPos); yPos += 10;
                    doc.text('• Active Rentals', 20, yPos); yPos += 10;
                    break;
                  case 'financial':
                    doc.text('• Revenue Summary', 20, yPos); yPos += 10;
                    doc.text('• Expense Analysis', 20, yPos); yPos += 10;
                    break;
                  case 'customers':
                    doc.text('• Customer Demographics', 20, yPos); yPos += 10;
                    doc.text('• Customer Satisfaction Scores', 20, yPos); yPos += 10;
                    break;
                  case 'maintenance':
                    doc.text('• Maintenance Schedule', 20, yPos); yPos += 10;
                    doc.text('• Maintenance Costs', 20, yPos); yPos += 10;
                    break;
                  case 'legal':
                    doc.text('• Legal Cases Summary', 20, yPos); yPos += 10;
                    doc.text('• Compliance Reports', 20, yPos); yPos += 10;
                    break;
                  default:
                    doc.text('No data available for this report type.', 20, yPos);
                }
                
                return yPos;
              },
              isArabic ? { rtl: true } : undefined
            );
            
            // Save the PDF
            doc.save(`${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
          } catch (error) {
            console.error("Error generating standard report:", error);
            throw new Error("Failed to generate the report");
          }
          console.log("PDF report generated successfully");
          
        } catch (error) {
          console.error("PDF generation error:", error);
          toast.error("Error generating PDF", {
            description: "Try using CSV or Excel format instead."
          });
          setIsGenerating(false);
          return;
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
          {/* Content kept empty as in original */}
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
        
        {fileFormat === 'pdf' && (
          <div className="flex items-center space-x-2">
            <label className="text-sm flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                checked={isArabic}
                onChange={(e) => setIsArabic(e.target.checked)}
              />
              Include Arabic
            </label>
          </div>
        )}

        <Button 
          onClick={handleDownload} 
          disabled={isGenerating || isTrafficFinesPdf}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Download Report'}
        </Button>
      </div>
      
      {isTrafficFinesPdf && (
        <div className="text-sm text-amber-600">
          For Traffic Fines PDF reports, please use the dedicated PDF download button above.
        </div>
      )}
    </div>
  );
};

export default ReportDownloadOptions;
