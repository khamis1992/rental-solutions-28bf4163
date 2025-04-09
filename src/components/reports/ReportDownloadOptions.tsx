
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { downloadCSV, downloadExcel, generateStandardReport } from '@/utils/report-utils';
import { toast } from 'sonner';

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
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [fileFormat, setFileFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Get data for the report
      const reportData = getReportData();
      
      // Debug log for data inspection
      console.log(`Generating ${reportType} report with ${reportData?.length || 0} records`, {
        recordCount: reportData?.length || 0,
        firstFewRecords: reportData?.slice(0, 3) || [],
        reportType,
        fileFormat
      });
      
      if (!reportData || reportData.length === 0) {
        console.log(`No data available for ${reportType} report`);
        toast.warning('No data available', { description: 'There is no data to include in this report.' });
        setIsGenerating(false);
        return;
      }
      
      // Format title based on report type
      const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      
      // Generate report based on file format
      if (fileFormat === 'pdf') {
        try {
          // Use the standardized report generator
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
                case 'traffic':
                  // For traffic fine reports, include actual data
                  doc.text('• Traffic Fine Summary', 20, yPos); yPos += 10;
                  
                  const totalFines = reportData.length;
                  doc.text(`• Total Fines: ${totalFines}`, 20, yPos); yPos += 10;
                  
                  const totalAmount = reportData.reduce((sum, fine) => {
                    // Ensure we're accessing the correct property and it's a number
                    const amount = typeof fine.fineAmount === 'number' ? fine.fineAmount : 
                                  typeof fine.fine_amount === 'number' ? fine.fine_amount : 0;
                    return sum + amount;
                  }, 0);
                  doc.text(`• Total Amount: QAR ${totalAmount.toFixed(2)}`, 20, yPos); yPos += 10;
                  
                  const paidFines = reportData.filter(fine => 
                    fine.paymentStatus === 'paid' || fine.payment_status === 'paid'
                  ).length;
                  doc.text(`• Paid Fines: ${paidFines}`, 20, yPos); yPos += 10;
                  
                  const pendingFines = reportData.filter(fine => 
                    fine.paymentStatus === 'pending' || fine.payment_status === 'pending'
                  ).length;
                  doc.text(`• Pending Fines: ${pendingFines}`, 20, yPos); yPos += 15;
                  
                  // Group fines by customer for PDF
                  const finesByCustomer = {};
                  reportData.forEach(fine => {
                    if (fine.customerId && fine.customerName) {
                      if (!finesByCustomer[fine.customerId]) {
                        finesByCustomer[fine.customerId] = {
                          customerName: fine.customerName,
                          fines: []
                        };
                      }
                      finesByCustomer[fine.customerId].fines.push(fine);
                    }
                  });
                  
                  // Add detailed listing if data exists
                  if (Object.keys(finesByCustomer).length > 0) {
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Fines by Customer:', 14, yPos);
                    yPos += 15;
                    
                    // Create a dedicated section for each customer
                    let pageCounter = 1;
                    Object.entries(finesByCustomer).forEach(([customerId, data]) => {
                      const customerData = data as { customerName: string, fines: any[] };
                      
                      // Check if we need a new page
                      if (yPos > 240) {
                        doc.addPage();
                        pageCounter++;
                        yPos = 20;
                        
                        // Add header to new page
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`Traffic Fine Report (Page ${pageCounter})`, 14, yPos);
                        yPos += 15;
                      }
                      
                      // Add customer header
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text(customerData.customerName, 14, yPos);
                      yPos += 6;
                      
                      // Add customer fines table header
                      doc.setFontSize(10);
                      doc.text('Violation #', 20, yPos);
                      doc.text('License Plate', 70, yPos);
                      doc.text('Date', 120, yPos);
                      doc.text('Amount', 170, yPos);
                      yPos += 6;
                      
                      // Add customer fines
                      doc.setFont('helvetica', 'normal');
                      customerData.fines.forEach(fine => {
                        // Check if we need a new page
                        if (yPos > 250) {
                          doc.addPage();
                          pageCounter++;
                          yPos = 20;
                          
                          // Add header to new page
                          doc.setFontSize(12);
                          doc.setFont('helvetica', 'bold');
                          doc.text(`Traffic Fine Report (Page ${pageCounter})`, 14, yPos);
                          yPos += 10;
                          
                          // Continue with customer
                          doc.text(customerData.customerName + " (continued)", 14, yPos);
                          yPos += 6;
                          
                          // Add table header again
                          doc.setFontSize(10);
                          doc.text('Violation #', 20, yPos);
                          doc.text('License Plate', 70, yPos);
                          doc.text('Date', 120, yPos);
                          doc.text('Amount', 170, yPos);
                          yPos += 6;
                          
                          doc.setFont('helvetica', 'normal');
                        }
                        
                        const violationNum = fine.violationNumber || 'N/A';
                        const licensePlate = fine.licensePlate || fine.license_plate || 'N/A';
                        
                        // Handle date formatting
                        let formattedDate = 'N/A';
                        try {
                          const violationDate = fine.violationDate || fine.violation_date;
                          if (violationDate) {
                            const dateObj = violationDate instanceof Date ? 
                              violationDate : new Date(violationDate);
                            if (!isNaN(dateObj.getTime())) {
                              formattedDate = format(dateObj, 'MMM dd, yyyy');
                            }
                          }
                        } catch (err) {
                          console.error("Error formatting date:", err);
                        }
                        
                        const amount = fine.fineAmount || fine.fine_amount || 0;
                        
                        doc.text(violationNum.toString().substring(0, 15), 20, yPos);
                        doc.text(licensePlate.toString().substring(0, 15), 70, yPos);
                        doc.text(formattedDate, 120, yPos);
                        doc.text(`QAR ${amount.toFixed(2)}`, 170, yPos);
                        
                        yPos += 6;
                      });
                      
                      // Add some space after each customer
                      yPos += 10;
                    });
                  }
                  
                  // Add unassigned fines section if there are any
                  const unassignedFines = reportData.filter(fine => !fine.customerId);
                  if (unassignedFines.length > 0) {
                    // Check if we need a new page
                    if (yPos > 220) {
                      doc.addPage();
                      pageCounter++;
                      yPos = 20;
                      
                      // Add title to new page
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`Traffic Fine Report (Page ${pageCounter})`, 14, yPos);
                      yPos += 10;
                    }
                    
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Unassigned Fines:', 14, yPos);
                    yPos += 10;
                    
                    // Add table header
                    doc.setFontSize(10);
                    doc.text('Violation #', 20, yPos);
                    doc.text('License Plate', 70, yPos);
                    doc.text('Date', 120, yPos);
                    doc.text('Amount', 170, yPos);
                    yPos += 6;
                    
                    // Add unassigned fines
                    doc.setFont('helvetica', 'normal');
                    unassignedFines.forEach(fine => {
                      // Check if we need a new page
                      if (yPos > 250) {
                        doc.addPage();
                        pageCounter++;
                        yPos = 20;
                        
                        // Add header to new page
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`Traffic Fine Report (Page ${pageCounter})`, 14, yPos);
                        yPos += 10;
                        
                        doc.text('Unassigned Fines (continued):', 14, yPos);
                        yPos += 6;
                        
                        // Add table header again
                        doc.setFontSize(10);
                        doc.text('Violation #', 20, yPos);
                        doc.text('License Plate', 70, yPos);
                        doc.text('Date', 120, yPos);
                        doc.text('Amount', 170, yPos);
                        yPos += 6;
                        
                        doc.setFont('helvetica', 'normal');
                      }
                      
                      const violationNum = fine.violationNumber || 'N/A';
                      const licensePlate = fine.licensePlate || fine.license_plate || 'N/A';
                      
                      // Handle date formatting
                      let formattedDate = 'N/A';
                      try {
                        const violationDate = fine.violationDate || fine.violation_date;
                        if (violationDate) {
                          const dateObj = violationDate instanceof Date ? 
                            violationDate : new Date(violationDate);
                          if (!isNaN(dateObj.getTime())) {
                            formattedDate = format(dateObj, 'MMM dd, yyyy');
                          }
                        }
                      } catch (err) {
                        console.error("Error formatting date:", err);
                      }
                      
                      const amount = fine.fineAmount || fine.fine_amount || 0;
                      
                      doc.text(violationNum.toString().substring(0, 15), 20, yPos);
                      doc.text(licensePlate.toString().substring(0, 15), 70, yPos);
                      doc.text(formattedDate, 120, yPos);
                      doc.text(`QAR ${amount.toFixed(2)}`, 170, yPos);
                      
                      yPos += 6;
                    });
                  }
                  
                  // If there's no data at all
                  if (reportData.length === 0) {
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'italic');
                    doc.text('No traffic fine data available for the selected period.', 20, yPos);
                    yPos += 10;
                  }
                  
                  break;
                case 'legal':
                  doc.text('• Legal Case Summary', 20, yPos); yPos += 10;
                  doc.text('• Active Legal Cases', 20, yPos); yPos += 10;
                  doc.text('• Case Resolution Rate', 20, yPos); yPos += 10;
                  doc.text('• Legal Expenses', 20, yPos); yPos += 10;
                  break;
                default:
                  doc.text('No specific data available for this report type.', 20, yPos);
              }
              
              return yPos; // Return the final y position
            }
          );
          
          // Save the PDF
          const filename = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          doc.save(filename);
          console.log(`PDF report saved: ${filename}`);
        } catch (error) {
          console.error('Error generating PDF:', error);
          throw new Error('PDF generation failed. Please try a different format.');
        }
      } else if (fileFormat === 'excel') {
        downloadExcel(reportData, `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      } else if (fileFormat === 'csv') {
        downloadCSV(reportData, `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      }
      
      // Show success toast notification
      toast.success('Report downloaded successfully!', {
        description: `Your ${reportType} report has been downloaded.`
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'There was a problem generating your report. Please try another format.'
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
