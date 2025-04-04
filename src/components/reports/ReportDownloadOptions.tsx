
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { 
  addReportHeader, 
  addReportFooter, 
  downloadCSV, 
  downloadExcel, 
  generateStandardReport,
  translateReportData
} from '@/utils/report-utils';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/TranslationContext';
import { useTranslation as useI18nTranslation } from 'react-i18next';

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
  
  // Get language and RTL status from translation context
  const { language, isRTL, translateText: translateTextFn } = useTranslation();
  const { t } = useI18nTranslation();

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Get data for the report
      let reportData = getReportData();
      
      // Format title based on report type
      const reportTypeCapitalized = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      const title = t(`reports.types.${reportType}`, `${reportTypeCapitalized} Report`);
      
      // Translate report data if in Arabic
      if (language === 'ar' && reportData.length > 0) {
        toast.info(t('reports.translating', 'Translating report data...'));
        try {
          reportData = await translateReportData(reportData, language);
        } catch (error) {
          console.error('Translation error:', error);
          toast.error(t('reports.translationError', 'Error translating report data'));
          // Continue with untranslated data
        }
      }
      
      // Generate report based on file format
      if (fileFormat === 'pdf') {
        try {
          // Use the standardized report generator with language parameter
          const doc = await generateStandardReport(
            title,
            dateRange,
            async (doc, startY, docIsRTL) => {
              // Add content based on report type
              let yPos = startY;
              
              // Add summary section heading
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              
              // Translate section title if needed
              let summaryText = t('reports.summary', 'Report Summary:');
              
              // Position text based on direction
              doc.text(summaryText, docIsRTL ? doc.internal.pageSize.getWidth() - 14 : 14, yPos, {
                align: docIsRTL ? 'right' : 'left'
              });
              yPos += 10;
              
              // Add content specific to each report type
              doc.setFontSize(12);
              doc.setFont('helvetica', 'normal');
              
              // Content position for RTL/LTR
              const contentX = docIsRTL ? doc.internal.pageSize.getWidth() - 20 : 20;
              const bulletPoint = docIsRTL ? '• ' : '• ';
              
              switch (reportType) {
                case 'fleet':
                  // Translate fleet report content if needed
                  let fleetItems = [
                    t('reports.fleet.totalVehicles', 'Total Vehicles in Fleet'),
                    t('reports.fleet.utilizationRate', 'Vehicle Utilization Rate'),
                    t('reports.fleet.activeRentals', 'Active Rentals'),
                    t('reports.fleet.inMaintenance', 'Vehicles in Maintenance'),
                    t('reports.fleet.performance', 'Fleet Performance Analysis')
                  ];
                  
                  for (const item of fleetItems) {
                    doc.text(bulletPoint + item, contentX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 10;
                  }
                  break;
                case 'financial':
                  // Financial report specific content
                  if (reportData.length === 0) {
                    const noDataMsg = t('reports.noData', 'No financial data available for the selected period.');
                    doc.text(noDataMsg, contentX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 20;
                  } else {
                    // Add financial overview
                    const financialOverview = t('reports.financial.overview', 'Financial Overview');
                    doc.text(bulletPoint + financialOverview, contentX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 10;
                    
                    // Calculate totals
                    const totalAmount = reportData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
                    const totalPaid = reportData.reduce((sum, item) => sum + (parseFloat(item.totalPaid) || 0), 0);
                    const totalOutstanding = reportData.reduce((sum, item) => sum + (parseFloat(item.outstandingBalance) || 0), 0);
                    const totalFines = reportData.reduce((sum, item) => sum + (parseFloat(item.totalFinesAmount) || 0), 0);
                    
                    // Translate labels
                    const totalAgreementsLabel = t('reports.financial.totalAgreements', 'Total Agreements');
                    const totalAmountLabel = t('reports.financial.totalAmount', 'Total Amount');
                    const totalPaidLabel = t('reports.financial.totalPaid', 'Total Paid');
                    const outstandingBalanceLabel = t('reports.financial.outstanding', 'Outstanding Balance');
                    const totalFinesLabel = t('reports.financial.fines', 'Total Traffic Fines');
                    
                    // Position indented text correctly based on direction
                    const detailX = docIsRTL ? doc.internal.pageSize.getWidth() - 30 : 30;
                    
                    doc.text(`${totalAgreementsLabel}: ${reportData.length}`, detailX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 8;
                    
                    doc.text(`${totalAmountLabel}: QAR ${totalAmount.toFixed(2)}`, detailX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 8;
                    
                    doc.text(`${totalPaidLabel}: QAR ${totalPaid.toFixed(2)}`, detailX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 8;
                    
                    doc.text(`${outstandingBalanceLabel}: QAR ${totalOutstanding.toFixed(2)}`, detailX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 8;
                    
                    doc.text(`${totalFinesLabel}: QAR ${totalFines.toFixed(2)}`, detailX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 20;
                    
                    // Add detailed table
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    
                    const agreementDetailsTitle = t('reports.financial.agreementDetails', 'Agreement Details:');
                    doc.text(agreementDetailsTitle, docIsRTL ? doc.internal.pageSize.getWidth() - 14 : 14, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 15;
                    
                    // Table headers with translations
                    const headers = [
                      t('reports.financial.customer', 'Customer'),
                      t('reports.financial.agreementNumber', 'Agreement #'),
                      t('reports.financial.status', 'Status'),
                      t('reports.financial.amountPaid', 'Amount Paid'),
                      t('reports.financial.balance', 'Balance'),
                      t('reports.financial.lastPayment', 'Last Payment')
                    ];
                    
                    const columnWidths = [50, 30, 25, 30, 30, 30];
                    
                    // Adjust header positioning for RTL
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    
                    if (docIsRTL) {
                      // For RTL, reverse the headers and start from right
                      let xPos = doc.internal.pageSize.getWidth() - 14;
                      [...headers].reverse().forEach((header, i) => {
                        doc.text(header, xPos, yPos, { align: 'right' });
                        xPos -= columnWidths[headers.length - 1 - i];
                      });
                    } else {
                      // For LTR, normal left-to-right rendering
                      let xPos = 14;
                      headers.forEach((header, i) => {
                        doc.text(header, xPos, yPos);
                        xPos += columnWidths[i];
                      });
                    }
                    
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
                      
                      const customerName = item.customers?.full_name || t('common.notAvailable', 'N/A');
                      const agreementNumber = item.agreement_number || t('common.notAvailable', 'N/A');
                      const paymentStatus = item.paymentStatus || t('common.notAvailable', 'N/A');
                      const amountPaid = `QAR ${(item.totalPaid || 0).toFixed(2)}`;
                      const balance = `QAR ${(item.outstandingBalance || 0).toFixed(2)}`;
                      const lastPaymentDate = item.lastPaymentDate ? 
                        new Date(item.lastPaymentDate).toLocaleDateString() : t('common.none', 'None');
                      
                      const displayCustomerName = customerName.length > 20 ? 
                        customerName.substring(0, 18) + '...' : customerName;
                      
                      if (docIsRTL) {
                        // For RTL, render from right to left
                        const values = [
                          lastPaymentDate, 
                          balance, 
                          amountPaid, 
                          paymentStatus, 
                          agreementNumber, 
                          displayCustomerName
                        ];
                        
                        let xPos = doc.internal.pageSize.getWidth() - 14;
                        values.forEach((value, i) => {
                          doc.text(value, xPos, yPos, { align: 'right' });
                          xPos -= columnWidths[headers.length - 1 - i];
                        });
                      } else {
                        // For LTR, render from left to right
                        let xPos = 14;
                        
                        doc.text(displayCustomerName, xPos, yPos);
                        xPos += columnWidths[0];
                        
                        doc.text(agreementNumber, xPos, yPos);
                        xPos += columnWidths[1];
                        
                        doc.text(paymentStatus, xPos, yPos);
                        xPos += columnWidths[2];
                        
                        doc.text(amountPaid, xPos, yPos);
                        xPos += columnWidths[3];
                        
                        doc.text(balance, xPos, yPos);
                        xPos += columnWidths[4];
                        
                        doc.text(lastPaymentDate, xPos, yPos);
                      }
                      
                      yPos += 8;
                    }
                  }
                  break;
                case 'customers':
                  // Translate customers report content
                  let customerItems = [
                    t('reports.customers.demographics', 'Customer Demographics'),
                    t('reports.customers.satisfaction', 'Customer Satisfaction Scores'),
                    t('reports.customers.frequency', 'Rental Frequency Analysis'),
                    t('reports.customers.top', 'Top Customers')
                  ];
                  
                  for (const item of customerItems) {
                    doc.text(bulletPoint + item, contentX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 10;
                  }
                  break;
                case 'maintenance':
                  // Translate maintenance report content
                  let maintenanceItems = [
                    t('reports.maintenance.schedule', 'Maintenance Schedule'),
                    t('reports.maintenance.costs', 'Maintenance Costs'),
                    t('reports.maintenance.upcoming', 'Upcoming Maintenance'),
                    t('reports.maintenance.history', 'Maintenance History')
                  ];
                  
                  for (const item of maintenanceItems) {
                    doc.text(bulletPoint + item, contentX, yPos, {
                      align: docIsRTL ? 'right' : 'left'
                    });
                    yPos += 10;
                  }
                  break;
                default:
                  const noDataAvailable = t('reports.noDataAvailable', 'No data available for this report type.');
                  doc.text(noDataAvailable, contentX, yPos, {
                    align: docIsRTL ? 'right' : 'left'
                  });
              }
              
              return yPos; // Return the final y position
            },
            language // Pass the current language
          );
          
          // Save the PDF
          doc.save(`${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
          
          toast.success(t('reports.download.success', "Report downloaded successfully!"), {
            description: t('reports.download.description', `Your ${reportType} report has been downloaded.`)
          });
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast.error(t('reports.download.failed', "Download failed"), {
            description: t('reports.download.errorDescription', "There was a problem generating your PDF report. Please try again.")
          });
        }
      } else if (fileFormat === 'excel') {
        try {
          downloadExcel(reportData, `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`, isRTL);
          toast.success(t('reports.download.success', "Report downloaded successfully!"), {
            description: t('reports.download.excelDescription', `Your ${reportType} report has been downloaded as Excel.`)
          });
        } catch (error) {
          console.error('Error generating Excel:', error);
          toast.error(t('reports.download.failed', "Download failed"), {
            description: t('reports.download.excelErrorDescription', "There was a problem generating your Excel report. Please try again.")
          });
        }
      } else if (fileFormat === 'csv') {
        try {
          downloadCSV(reportData, `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`, isRTL);
          toast.success(t('reports.download.success', "Report downloaded successfully!"), {
            description: t('reports.download.csvDescription', `Your ${reportType} report has been downloaded as CSV.`)
          });
        } catch (error) {
          console.error('Error generating CSV:', error);
          toast.error(t('reports.download.failed', "Download failed"), {
            description: t('reports.download.csvErrorDescription', "There was a problem generating your CSV report. Please try again.")
          });
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(t('reports.download.failed', "Download failed"), {
        description: t('reports.download.generalError', "There was a problem generating your report. Please try again.")
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
          <h3 className="text-lg font-semibold">{t('reports.options.title', 'Report Options')}</h3>
        </div>
      </div>
      
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {dateRange?.from ? dateRange.to ? <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </> : format(dateRange.from, "LLL dd, y") : 
                    <span>{t('reports.options.dateRangePlaceholder', 'Pick a date range')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange as any} onSelect={range => setDateRange(range as any)} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-40">
          <Select value={fileFormat} onValueChange={setFileFormat}>
            <SelectTrigger>
              <SelectValue placeholder={t('reports.options.format', 'Format')} />
            </SelectTrigger>
            <SelectContent align={isRTL ? 'end' : 'start'}>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleDownload} disabled={isGenerating}>
          <FileDown className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
          {isGenerating ? 
            t('reports.options.generating', 'Generating...') : 
            t('reports.options.download', 'Download Report')}
        </Button>
      </div>
      
      <div className="mt-6 pt-4 border-t flex flex-col items-center">
        
        
      </div>
    </div>
  );
};

export default ReportDownloadOptions;
