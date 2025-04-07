
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileDown, FileText, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { downloadCSV, downloadExcel, generateStandardReport } from '@/utils/report-utils';
import { generateTrafficFinesPDF } from '@/utils/traffic-fines-report-utils';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const [pdfOptions, setPdfOptions] = useState({
    includeCoverPage: true,
    includeExecutiveSummary: true,
    includeTimeBasedAnalysis: true,
    includeVehicleAnalysis: true,
    includeCustomerRiskProfile: true,
    includeAppendix: true
  });

  const handleOptionChange = (option: keyof typeof pdfOptions) => {
    setPdfOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      const reportData = getReportData();
      
      const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      
      if (fileFormat === 'pdf') {
        try {
          let doc;
          
          if (reportType === 'trafficFines') {
            doc = await generateTrafficFinesPDF(reportData as any, dateRange, pdfOptions);
          } else {
            doc = await generateStandardReport(
              title,
              dateRange,
              async (doc, startY) => {
                let yPos = startY;
                
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Report Summary:', 14, yPos);
                yPos += 10;
                
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
                    if (reportData.length === 0) {
                      doc.text('No financial data available for the selected period.', 20, yPos);
                      yPos += 20;
                    } else {
                      doc.text('• Financial Overview', 20, yPos); yPos += 10;
                      
                      const totalAmount = reportData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
                      const totalPaid = reportData.reduce((sum, item) => sum + (parseFloat(item.totalPaid) || 0), 0);
                      const totalOutstanding = reportData.reduce((sum, item) => sum + (parseFloat(item.outstandingBalance) || 0), 0);
                      const totalFines = reportData.reduce((sum, item) => sum + (parseFloat(item.totalFinesAmount) || 0), 0);
                      
                      doc.text(`   Total Agreements: ${reportData.length}`, 20, yPos); yPos += 8;
                      doc.text(`   Total Amount: QAR ${totalAmount.toFixed(2)}`, 20, yPos); yPos += 8;
                      doc.text(`   Total Paid: QAR ${totalPaid.toFixed(2)}`, 20, yPos); yPos += 8;
                      doc.text(`   Outstanding Balance: QAR ${totalOutstanding.toFixed(2)}`, 20, yPos); yPos += 8;
                      doc.text(`   Total Traffic Fines: QAR ${totalFines.toFixed(2)}`, 20, yPos); yPos += 20;
                      
                      doc.setFontSize(14);
                      doc.setFont('helvetica', 'bold');
                      doc.text('Agreement Details:', 14, yPos);
                      yPos += 15;
                      
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
                      
                      doc.setFont('helvetica', 'normal');
                      
                      for (const item of reportData) {
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
                  default:
                    doc.text('No specific data visualization available for this report type.', 20, yPos);
                }
                
                return yPos;
              }
            );
          }
          
          const reportFileName = `${reportType.toLowerCase()}_report_${format(new Date(), 'yyyyMMdd')}.pdf`;
          doc.save(reportFileName);
          
          toast.success(`Report downloaded successfully as ${reportFileName}`);
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast.error('Failed to generate PDF report');
        }
      } else if (fileFormat === 'csv') {
        const filename = `${reportType.toLowerCase()}_report_${format(new Date(), 'yyyyMMdd')}.csv`;
        downloadCSV(reportData, filename);
        toast.success(`Report downloaded as ${filename}`);
      } else if (fileFormat === 'excel') {
        const filename = `${reportType.toLowerCase()}_report_${format(new Date(), 'yyyyMMdd')}.xlsx`;
        downloadExcel(reportData, filename);
        toast.success(`Report downloaded as ${filename}`);
      }
    } catch (err) {
      console.error('Report download error:', err);
      toast.error('Failed to download report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex-1 min-w-[200px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-full",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              initialFocus
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                if (range) {
                  setDateRange(range);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="w-[120px]">
        <Select value={fileFormat} onValueChange={setFileFormat}>
          <SelectTrigger>
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {fileFormat === 'pdf' && reportType === 'trafficFines' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="Report Options">
              <Flag className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>PDF Report Options</DialogTitle>
              <DialogDescription>
                Customize the sections included in your traffic fines report
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="coverPage" 
                  checked={pdfOptions.includeCoverPage}
                  onCheckedChange={() => handleOptionChange('includeCoverPage')}
                />
                <Label htmlFor="coverPage">Include cover page</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="execSummary" 
                  checked={pdfOptions.includeExecutiveSummary}
                  onCheckedChange={() => handleOptionChange('includeExecutiveSummary')}
                />
                <Label htmlFor="execSummary">Include executive summary</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="timeAnalysis" 
                  checked={pdfOptions.includeTimeBasedAnalysis}
                  onCheckedChange={() => handleOptionChange('includeTimeBasedAnalysis')}
                />
                <Label htmlFor="timeAnalysis">Include time-based analysis</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vehicleAnalysis" 
                  checked={pdfOptions.includeVehicleAnalysis}
                  onCheckedChange={() => handleOptionChange('includeVehicleAnalysis')}
                />
                <Label htmlFor="vehicleAnalysis">Include vehicle analysis</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="customerRisk" 
                  checked={pdfOptions.includeCustomerRiskProfile}
                  onCheckedChange={() => handleOptionChange('includeCustomerRiskProfile')}
                />
                <Label htmlFor="customerRisk">Include customer risk profile</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="appendix" 
                  checked={pdfOptions.includeAppendix}
                  onCheckedChange={() => handleOptionChange('includeAppendix')}
                />
                <Label htmlFor="appendix">Include appendix with legal references</Label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      <Button
        onClick={handleDownload}
        disabled={isGenerating || !dateRange.from || !dateRange.to}
        className={isGenerating ? "opacity-70" : ""}
      >
        {isGenerating ? (
          <>Generating<span className="loading-dots">...</span></>
        ) : (
          <>
            <FileDown className="mr-1.5 h-4 w-4" />
            Download
          </>
        )}
      </Button>
    </div>
  );
};

export default ReportDownloadOptions;
