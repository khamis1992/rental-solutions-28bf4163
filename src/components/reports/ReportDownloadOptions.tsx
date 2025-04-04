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
import { 
  addReportHeader, 
  addReportFooter, 
  downloadCSV, 
  downloadExcel, 
  generateStandardReport, 
  translateReportContent 
} from '@/utils/report-utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
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
  const { t } = useI18nTranslation();
  const { language, isRTL } = useTranslation();
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
      
      // Determine if translation is needed
      const needsTranslation = language === 'ar';
      
      // Format title based on report type
      let title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      
      // If needed, translate the title
      if (needsTranslation) {
        try {
          // Use i18n first if available
          const i18nKey = `reports.${reportType}Report`;
          const translatedTitle = t(i18nKey);
          
          // If translation exists in i18n, use it
          if (translatedTitle !== i18nKey) {
            title = translatedTitle;
          } else {
            // Otherwise use the API
            title = await translateReportContent(title, 'ar');
          }
          console.log(`Using translated title: ${title}`);
        } catch (error) {
          console.error('Error translating title:', error);
          // Continue with original title if translation fails
        }
      }
      
      // Generate report based on file format
      if (fileFormat === 'pdf') {
        try {
          // Use the standardized report generator with language support
          const doc = await generateStandardReport(
            title,
            dateRange,
            async (doc, startY, isRTL) => {
              // Add content based on report type
              let yPos = startY;
              
              // Add summary section heading
              const summaryTitle = isRTL ? 'ملخص التقرير:' : 'Report Summary:';
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              
              // Position heading based on text direction
              const headingX = isRTL ? doc.internal.pageSize.getWidth() - 14 : 14;
              doc.text(summaryTitle, headingX, yPos, { align: isRTL ? 'right' : 'left' });
              yPos += 10;
              
              // Add content specific to each report type
              doc.setFontSize(12);
              doc.setFont('helvetica', 'normal');
              
              // Bullet point indentation
              const bulletIndent = 20;
              const contentIndent = isRTL ? doc.internal.pageSize.getWidth() - bulletIndent : bulletIndent;
              
              switch (reportType) {
                case 'fleet':
                  // Translate bullet points if needed
                  const fleetPoints = [
                    isRTL ? '• إجمالي المركبات في الأسطول' : '• Total Vehicles in Fleet',
                    isRTL ? '• معدل استخدام المركبات' : '• Vehicle Utilization Rate',
                    isRTL ? '• التأجيرات النشطة' : '• Active Rentals',
                    isRTL ? '• المركبات في الصيانة' : '• Vehicles in Maintenance',
                    isRTL ? '• تحليل أداء الأسطول' : '• Fleet Performance Analysis'
                  ];
                  
                  for (const point of fleetPoints) {
                    doc.text(point, contentIndent, yPos, { align: isRTL ? 'right' : 'left' });
                    yPos += 10;
                  }
                  break;
                case 'financial':
                  // Financial report specific content
                  if (reportData.length === 0) {
                    const noDataText = isRTL 
                      ? 'لا توجد بيانات مالية متاحة للفترة المحددة.'
                      : 'No financial data available for the selected period.';
                    doc.text(noDataText, contentIndent, yPos, { align: isRTL ? 'right' : 'left' });
                    yPos += 20;
                  } else {
                    // Add financial overview
                    const overviewText = isRTL ? '• النظرة المالية العامة' : '• Financial Overview';
                    doc.text(overviewText, contentIndent, yPos, { align: isRTL ? 'right' : 'left' });
                    yPos += 10;
                    
                    // Calculate totals
                    const totalAmount = reportData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
                    const totalPaid = reportData.reduce((sum, item) => sum + (parseFloat(item.totalPaid) || 0), 0);
                    const totalOutstanding = reportData.reduce((sum, item) => sum + (parseFloat(item.outstandingBalance) || 0), 0);
                    const totalFines = reportData.reduce((sum, item) => sum + (parseFloat(item.totalFinesAmount) || 0), 0);
                    
                    // Translate summary texts
                    const agreementsText = isRTL 
                      ? `   إجمالي الاتفاقيات: ${isRTL ? new Intl.NumberFormat('ar-SA').format(reportData.length) : reportData.length}`
                      : `   Total Agreements: ${reportData.length}`;
                    const amountText = isRTL
                      ? `   المبلغ الإجمالي: ${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'QAR' }).format(totalAmount)}`
                      : `   Total Amount: QAR ${totalAmount.toFixed(2)}`;
                    const paidText = isRTL
                      ? `   المبلغ المدفوع: ${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'QAR' }).format(totalPaid)}`
                      : `   Total Paid: QAR ${totalPaid.toFixed(2)}`;
                    const outstandingText = isRTL
                      ? `   الرصيد ا��مستحق: ${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'QAR' }).format(totalOutstanding)}`
                      : `   Outstanding Balance: QAR ${totalOutstanding.toFixed(2)}`;
                    const finesText = isRTL
                      ? `   إجمالي مخالفات المرور: ${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'QAR' }).format(totalFines)}`
                      : `   Total Traffic Fines: QAR ${totalFines.toFixed(2)}`;
                    
                    // Position and alignment for summary lines
                    const summaryIndent = isRTL ? doc.internal.pageSize.getWidth() - 20 : 20;
                    
                    doc.text(agreementsText, summaryIndent, yPos, { align: isRTL ? 'right' : 'left' }); yPos += 8;
                    doc.text(amountText, summaryIndent, yPos, { align: isRTL ? 'right' : 'left' }); yPos += 8;
                    doc.text(paidText, summaryIndent, yPos, { align: isRTL ? 'right' : 'left' }); yPos += 8;
                    doc.text(outstandingText, summaryIndent, yPos, { align: isRTL ? 'right' : 'left' }); yPos += 8;
                    doc.text(finesText, summaryIndent, yPos, { align: isRTL ? 'right' : 'left' }); yPos += 20;
                    
                    // Add detailed table
                    const detailsTitle = isRTL ? 'تفاصيل الاتفاقية:' : 'Agreement Details:';
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    const detailsX = isRTL ? doc.internal.pageSize.getWidth() - 14 : 14;
                    doc.text(detailsTitle, detailsX, yPos, { align: isRTL ? 'right' : 'left' });
                    yPos += 15;
                    
                    // Table headers
                    const headers = isRTL
                      ? ['العميل', 'رقم الاتفاقية', 'الحالة', 'المبلغ المدفوع', 'الرصيد', 'الدفعة الأخيرة']
                      : ['Customer', 'Agreement #', 'Status', 'Amount Paid', 'Balance', 'Last Payment'];
                      
                    const columnWidths = [50, 30, 25, 30, 30, 30];
                    let xPos = isRTL ? doc.internal.pageSize.getWidth() - 14 : 14;
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    
                    if (isRTL) {
                      // For RTL, we need to draw headers from right to left
                      for (let i = 0; i < headers.length; i++) {
                        const header = headers[i];
                        xPos -= columnWidths[i];
                        doc.text(header, xPos, yPos, { align: 'right' });
                      }
                    } else {
                      // For LTR, we draw from left to right
                      for (let i = 0; i < headers.length; i++) {
                        const header = headers[i];
                        doc.text(header, xPos, yPos);
                        xPos += columnWidths[i];
                      }
                    }
                    
                    yPos += 8;
                    doc.setLineWidth(0.3);
                    doc.line(14, yPos - 4, doc.internal.pageSize.getWidth() - 14, yPos - 4);
                    
                    // Table rows
                    doc.setFont('helvetica', 'normal');
                    
                    for (const item of reportData) {
                      // Check if we need a new page
                      if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                      }
                      
                      if (isRTL) {
                        // For RTL, draw from right to left
                        xPos = doc.internal.pageSize.getWidth() - 14;
                        
                        // Last payment date (rightmost in RTL)
                        const lastPaymentDate = item.lastPaymentDate ? 
                          new Date(item.lastPaymentDate).toLocaleDateString('ar-SA') : 'لا يوجد';
                        xPos -= columnWidths[5];
                        doc.text(lastPaymentDate, xPos, yPos, { align: 'right' });
                        
                        // Balance
                        const balance = new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'QAR' })
                          .format(item.outstandingBalance || 0);
                        xPos -= columnWidths[4];
                        doc.text(balance, xPos, yPos, { align: 'right' });
                        
                        // Amount paid
                        const amountPaid = new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'QAR' })
                          .format(item.totalPaid || 0);
                        xPos -= columnWidths[3];
                        doc.text(amountPaid, xPos, yPos, { align: 'right' });
                        
                        // Status
                        const statusMap: Record<string, string> = {
                          'Paid': 'مدفوع',
                          'Partially Paid': 'مدفوع جزئياً',
                          'Unpaid': 'غير مدفوع'
                        };
                        const status = statusMap[item.paymentStatus] || item.paymentStatus;
                        xPos -= columnWidths[2];
                        doc.text(status, xPos, yPos, { align: 'right' });
                        
                        // Agreement number
                        xPos -= columnWidths[1];
                        doc.text(item.agreement_number || 'N/A', xPos, yPos, { align: 'right' });
                        
                        // Customer name (leftmost in RTL)
                        const customerName = item.customers?.full_name || 'N/A';
                        const displayName = customerName.length > 20 ? customerName.substring(0, 18) + '...' : customerName;
                        xPos -= columnWidths[0];
                        doc.text(displayName, xPos, yPos, { align: 'right' });
                      } else {
                        // For LTR, draw from left to right
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
                      }
                      
                      yPos += 8;
                    }
                  }
                  break;
                case 'customers':
                  const customerPoints = [
                    isRTL ? '• التركيبة السكانية للعملاء' : '• Customer Demographics',
                    isRTL ? '• درجات رضا العملاء' : '• Customer Satisfaction Scores',
                    isRTL ? '• تحليل تكرار التأجير' : '• Rental Frequency Analysis',
                    isRTL ? '• كبار العملاء' : '• Top Customers'
                  ];
                  
                  for (const point of customerPoints) {
                    doc.text(point, contentIndent, yPos, { align: isRTL ? 'right' : 'left' });
                    yPos += 10;
                  }
                  break;
                case 'maintenance':
                  const maintenancePoints = [
                    isRTL ? '• جدول الصيانة' : '• Maintenance Schedule',
                    isRTL ? '• تكاليف الصيانة' : '• Maintenance Costs',
                    isRTL ? '• الصيانة القادمة' : '• Upcoming Maintenance',
                    isRTL ? '• سجل الصيانة' : '• Maintenance History'
                  ];
                  
                  for (const point of maintenancePoints) {
                    doc.text(point, contentIndent, yPos, { align: isRTL ? 'right' : 'left' });
                    yPos += 10;
                  }
                  break;
                default:
                  const noDataText = isRTL 
                    ? 'لا توجد بيانات متاحة لهذا النوع من التقارير.'
                    : 'No data available for this report type.';
                  doc.text(noDataText, contentIndent, yPos, { align: isRTL ? 'right' : 'left' });
              }
              
              return yPos; // Return the final y position
            },
            language // Pass the current language for RTL support
          );
          
          // Save the PDF with appropriate filename
          const filename = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          doc.save(filename);
          
          // Success message for the appropriate language
          const successMessage = language === 'ar' 
            ? "تم تنزيل التقرير بنجاح!" 
            : "Report downloaded successfully!";
            
          const descriptionMessage = language === 'ar'
            ? `تم تنزيل تقرير ${title}.`
            : `Your ${reportType} report has been downloaded.`;
            
          toast.success(successMessage, {
            description: descriptionMessage
          });
        } catch (error) {
          console.error('Error generating PDF:', error);
          
          // Error message for the appropriate language
          const errorMessage = language === 'ar'
            ? "فشل التنزيل"
            : "Download failed";
            
          const errorDescription = language === 'ar'
            ? "حدثت مشكلة في إنشاء تقرير PDF. يرجى المحاولة مرة أخرى."
            : "There was a problem generating your PDF report. Please try again.";
            
          toast.error(errorMessage, {
            description: errorDescription
          });
        }
      } else if (fileFormat === 'excel') {
        try {
          const filename = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
          downloadExcel(reportData, filename, isRTL);
          
          const successMessage = language === 'ar' 
            ? "تم تنزيل التقرير بنجاح!" 
            : "Report downloaded successfully!";
            
          const descriptionMessage = language === 'ar'
            ? `تم تنزيل تقرير ${title} بتنسيق إكسل.`
            : `Your ${reportType} report has been downloaded as Excel.`;
            
          toast.success(successMessage, {
            description: descriptionMessage
          });
        } catch (error) {
          console.error('Error generating Excel:', error);
          
          const errorMessage = language === 'ar'
            ? "فشل التنزيل"
            : "Download failed";
            
          const errorDescription = language === 'ar'
            ? "حدثت مشكلة في إنشاء تقرير إكسل. يرجى المحاولة مرة أخرى."
            : "There was a problem generating your Excel report. Please try again.";
            
          toast.error(errorMessage, {
            description: errorDescription
          });
        }
      } else if (fileFormat === 'csv') {
        try {
          const filename = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          downloadCSV(reportData, filename, isRTL);
          
          const successMessage = language === 'ar' 
            ? "تم تنزيل التقرير بنجاح!" 
            : "Report downloaded successfully!";
            
          const descriptionMessage = language === 'ar'
            ? `تم تنزيل تقرير ${title} بتنسيق CSV.`
            : `Your ${reportType} report has been downloaded as CSV.`;
            
          toast.success(successMessage, {
            description: descriptionMessage
          });
        } catch (error) {
          console.error('Error generating CSV:', error);
          
          const errorMessage = language === 'ar'
            ? "فشل التنزيل"
            : "Download failed";
            
          const errorDescription = language === 'ar'
            ? "حدثت مشكلة في إنشاء تقرير CSV. يرجى المحاولة مرة أخرى."
            : "There was a problem generating your CSV report. Please try again.";
            
          toast.error(errorMessage, {
            description: errorDescription
          });
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      
      const errorMessage = language === 'ar'
        ? "فشل التنزيل"
        : "Download failed";
        
      const errorDescription = language === 'ar'
        ? "حدثت مشكلة في إنشاء التقرير. يرجى المحاولة مرة أخرى."
        : "There was a problem generating your report. Please try again.";
        
      toast.error(errorMessage, {
        description: errorDescription
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
          <h3 className="text-lg font-semibold">{isRTL ? 'خيارات التقرير' : 'Report Options'}</h3>
        </div>
      </div>
      
      <div className={`flex items-center gap-4 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {dateRange?.from ? dateRange.to ? <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </> : format(dateRange.from, "LLL dd, y") : 
                      <span>{isRTL ? 'اختر نطاق تاريخ' : 'Pick a date range'}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align={isRTL ? "end" : "start"}>
              <Calendar 
                initialFocus 
                mode="range" 
                defaultMonth={dateRange?.from} 
                selected={dateRange as any} 
                onSelect={range => setDateRange(range as any)} 
                numberOfMonths={2} 
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-40">
          <Select value={fileFormat} onValueChange={setFileFormat}>
            <SelectTrigger>
              <SelectValue placeholder={isRTL ? 'التنسيق' : 'Format'} />
            </SelectTrigger>
            <SelectContent align={isRTL ? "end" : "start"}>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">
                {isRTL ? 'إكسل' : 'Excel'}
              </SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleDownload} disabled={isGenerating} className={isRTL ? 'flex-row-reverse' : ''}>
          <FileDown className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
          {isGenerating ? 
            (isRTL ? 'جاري الإنشاء...' : 'Generating...') : 
            (isRTL ? 'تنزيل التقرير' : 'Download Report')}
        </Button>
      </div>
      
      <div className="mt-6 pt-4 border-t flex flex-col items-center">
        
      </div>
    </div>
  );
};

export default ReportDownloadOptions;
