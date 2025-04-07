import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import { addReportHeader, addReportFooter, downloadCSV, downloadExcel, generateStandardReport } from '@/utils/report-utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Get data for the report
      const reportData = getReportData();
      
      // Format title based on report type
      const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      
      // Generate report based on file format
      if (fileFormat === 'pdf') {
        try {
          // Use the standardized report generator
          const doc = await generateStandardReport(
            title,
            dateRange,
            async (doc, startY) => {
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
                  // Financial report specific content
                  if (reportData.length === 0) {
                    doc.text('No financial data available for the selected period.', 20, yPos);
                    yPos += 20;
                  } else {
                    // Add financial overview
                    doc.text('• Financial Overview', 20, yPos); yPos += 10;
                    
                    // Calculate totals
                    const totalAmount = reportData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
                    const totalPaid = reportData.reduce((sum, item) => sum + (parseFloat(item.totalPaid) || 0), 0);
                    const totalOutstanding = reportData.reduce((sum, item) => sum + (parseFloat(item.outstandingBalance) || 0), 0);
                    const totalFines = reportData.reduce((sum, item) => sum + (parseFloat(item.totalFinesAmount) || 0), 0);
                    
                    doc.text(`   Total Agreements: ${reportData.length}`, 20, yPos); yPos += 8;
                    doc.text(`   Total Amount: QAR ${totalAmount.toFixed(2)}`, 20, yPos); yPos += 8;
                    doc.text(`   Total Paid: QAR ${totalPaid.toFixed(2)}`, 20, yPos); yPos += 8;
                    doc.text(`   Outstanding Balance: QAR ${totalOutstanding.toFixed(2)}`, 20, yPos); yPos += 8;
                    doc.text(`   Total Traffic Fines: QAR ${totalFines.toFixed(2)}`, 20, yPos); yPos += 20;
                    
                    // Add detailed table
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Agreement Details:', 14, yPos);
                    yPos += 15;
                    
                    // Table headers
                    const headers = ['Customer', 'Agreement #', 'Status', 'Amount Paid', 'Balance', 'Last Payment'];
                    const columnWidths = [50, 30, 25, 30, 30, 30];
                    let xPos = 14;
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    
                    headers.forEach((header, i) => {
                      doc.text(header, xPos, yPos);
                      xPos += columnWidths[i];
                    });
                    
                    yPos += 8;
                    doc.setLineWidth(0.3);
                    doc.line(14, yPos - 4, 195, yPos - 4);
                    
                    // Table rows
                    doc.setFont('helvetica', 'normal');
                    
                    for (const item of reportData) {
                      // Check if we need a new page
                      if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                      }
                      
                      xPos = 14;
                      
                      const customerName = item.customers?.full_name || 'N/A';
                      doc.text(customerName.length > 20 ? customerName.substring(0, 18) + '...' : customerName, xPos, yPos);
                      xPos += columnWidths[0];
                      
                      doc.text(item.agreement_number || 'N/A', xPos, yPos);
                      xPos += columnWidths[1];
                      
                      doc.text(item.paymentStatus || 'N/A', xPos, yPos);
                      xPos += columnWidths[2];
                      
                      doc.text(`QAR ${(item.totalPaid || 0).toFixed(2)}`, xPos, yPos);
                      xPos += columnWidths[3];
                      
                      doc.text(`QAR ${(item.outstandingBalance || 0).toFixed(2)}`, xPos, yPos);
                      xPos += columnWidths[4];
                      
                      const lastPaymentDate = item.lastPaymentDate ? 
                        new Date(item.lastPaymentDate).toLocaleDateString() : 'None';
                      doc.text(lastPaymentDate, xPos, yPos);
                      
                      yPos += 8;
                    }
                  }
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
                case 'trafficFines':
                  if (reportData.length === 0) {
                    doc.text('No traffic fine data available for the selected period.', 20, yPos);
                    yPos += 20;
                  } else {
                    // Add traffic fines overview
                    doc.text('• Traffic Fines Overview', 20, yPos); yPos += 10;
                    
                    // Calculate totals
                    const totalFines = reportData.length;
                    const totalAmount = reportData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    const paidFines = reportData.filter(item => item.status === 'paid').length;
                    const paidAmount = reportData
                      .filter(item => item.status === 'paid')
                      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    const pendingAmount = totalAmount - paidAmount;
                    
                    doc.text(`   Total Fines: ${totalFines}`, 20, yPos); yPos += 8;
                    doc.text(`   Total Amount: QAR ${totalAmount.toFixed(2)}`, 20, yPos); yPos += 8;
                    doc.text(`   Paid Fines: ${paidFines}`, 20, yPos); yPos += 8;
                    doc.text(`   Paid Amount: QAR ${paidAmount.toFixed(2)}`, 20, yPos); yPos += 8;
                    doc.text(`   Pending Amount: QAR ${pendingAmount.toFixed(2)}`, 20, yPos); yPos += 20;
                    
                    // Add detailed table
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Traffic Fine Details:', 14, yPos);
                    yPos += 15;
                    
                    // Table headers
                    const headers = ['Customer', 'Violation #', 'License Plate', 'Amount', 'Status', 'Date'];
                    const columnWidths = [40, 30, 25, 25, 25, 30];
                    let xPos = 14;
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    
                    headers.forEach((header, i) => {
                      doc.text(header, xPos, yPos);
                      xPos += columnWidths[i];
                    });
                    
                    yPos += 8;
                    doc.setLineWidth(0.3);
                    doc.line(14, yPos - 4, 195, yPos - 4);
                    
                    // Table rows
                    doc.setFont('helvetica', 'normal');
                    
                    for (const fine of reportData) {
                      // Check if we need a new page
                      if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                      }
                      
                      xPos = 14;
                      
                      const customerName = fine.customer_name || 'N/A';
                      doc.text(customerName.length > 20 ? customerName.substring(0, 18) + '...' : customerName, xPos, yPos);
                      xPos += columnWidths[0];
                      
                      doc.text(fine.violation_number || 'N/A', xPos, yPos);
                      xPos += columnWidths[1];
                      
                      doc.text(fine.license_plate || 'N/A', xPos, yPos);
                      xPos += columnWidths[2];
                      
                      doc.text(`QAR ${(parseFloat(fine.amount) || 0).toFixed(2)}`, xPos, yPos);
                      xPos += columnWidths[3];
                      
                      doc.text(fine.status || 'N/A', xPos, yPos);
                      xPos += columnWidths[4];
                      
                      const violationDate = fine.violation_date ? 
                        new Date(fine.violation_date).toLocaleDateString() : 'N/A';
                      doc.text(violationDate, xPos, yPos);
                      
                      yPos += 8;
                    }
                  }
                  break;
                default:
                  doc.text('No data available for this report type.', 20, yPos);
              }
              
              return yPos; // Return the final y position
            }
          );
          
          // Save the PDF
          doc.save(`${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
          
          toast.success("Report downloaded successfully!", {
            description: `Your ${reportType} report has been downloaded.`
          });
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast.error("Download failed", {
            description: "There was a problem generating your PDF report. Please try again."
          });
        }
      } else if (fileFormat === 'excel') {
        try {
          downloadExcel(reportData, `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
          toast.success("Report downloaded successfully!", {
            description: `Your ${reportType} report has been downloaded as Excel.`
          });
        } catch (error) {
          console.error('Error generating Excel:', error);
          toast.error("Download failed", {
            description: "There was a problem generating your Excel report. Please try again."
          });
        }
      } else if (fileFormat === 'csv') {
        try {
          downloadCSV(reportData, `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
          toast.success("Report downloaded successfully!", {
            description: `Your ${reportType} report has been downloaded as CSV.`
          });
        } catch (error) {
          console.error('Error generating CSV:', error);
          toast.error("Download failed", {
            description: "There was a problem generating your CSV report. Please try again."
          });
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Download failed", {
        description: "There was a problem generating your report. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return <div className="space-y-4">
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
    </div>;
};
export default ReportDownloadOptions;
