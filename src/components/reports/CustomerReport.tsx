
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { FileText, Download, Users, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { DateRange } from 'react-day-picker';
import { addDays, subDays } from 'date-fns';
import { generatePDFSafely, initializePDFSystem, isPDFSystemReady } from '@/utils/pdf-generator';
import { getBestArabicFont, getFontLoadingStatus } from '@/utils/font-loader';
import { toast } from 'sonner';

const CustomerReport: React.FC = () => {
  const { language } = useLanguage();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('summary');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfSystemStatus, setPdfSystemStatus] = useState({
    ready: false,
    loading: true,
    fonts: [] as string[]
  });

  // Initialize PDF system on component mount
  useEffect(() => {
    const initPDF = async () => {
      try {
        await initializePDFSystem();
        const status = getFontLoadingStatus();
        setPdfSystemStatus({
          ready: isPDFSystemReady(),
          loading: status.loading,
          fonts: status.availableFonts
        });
      } catch (error) {
        console.warn('PDF system initialization warning:', error);
        setPdfSystemStatus({
          ready: true, // Allow generation with fallback
          loading: false,
          fonts: ['Roboto']
        });
      }
    };

    initPDF();
  }, []);

  // Mock data for demonstration
  const mockCustomerData = {
    totalCustomers: 45,
    activeCustomers: 38,
    newCustomers: 7,
    totalRevenue: 125000,
    averageRental: 2850,
    topCustomers: [
      { name: 'أحمد محمد الأحمد', revenue: 15000, agreements: 5 },
      { name: 'فاطمة عبدالله السالم', revenue: 12500, agreements: 4 },
      { name: 'محمد عبدالرحمن النعيمي', revenue: 11000, agreements: 3 }
    ]
  };

  const generateCustomerFinancialReport = async () => {
    if (!pdfSystemStatus.ready && pdfSystemStatus.loading) {
      toast.warning(language === 'ar' ? 'جاري تحميل الخطوط، يرجى الانتظار...' : 'Loading fonts, please wait...');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Starting customer financial report generation...');
      
      // Get the best available font
      const fontName = getBestArabicFont();
      console.log(`Using font for report: ${fontName}`);

      // Create document definition
      const documentDefinition = {
        content: [
          // Header
          {
            text: language === 'ar' ? 'تقرير العملاء المالي' : 'Customer Financial Report',
            style: 'header',
            alignment: language === 'ar' ? 'right' : 'left'
          },
          {
            text: language === 'ar' ? 
              `تاريخ التقرير: ${formatDate(new Date())}` : 
              `Report Date: ${formatDate(new Date())}`,
            style: 'subheader',
            alignment: language === 'ar' ? 'right' : 'left',
            margin: [0, 0, 0, 20]
          },

          // Summary Section
          {
            text: language === 'ar' ? 'ملخص العملاء' : 'Customer Summary',
            style: 'sectionHeader',
            alignment: language === 'ar' ? 'right' : 'left'
          },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: language === 'ar' ? 'إجمالي العملاء' : 'Total Customers', style: 'tableHeader' },
                  { text: mockCustomerData.totalCustomers.toString(), style: 'tableData' }
                ],
                [
                  { text: language === 'ar' ? 'العملاء النشطون' : 'Active Customers', style: 'tableHeader' },
                  { text: mockCustomerData.activeCustomers.toString(), style: 'tableData' }
                ],
                [
                  { text: language === 'ar' ? 'العملاء الجدد' : 'New Customers', style: 'tableHeader' },
                  { text: mockCustomerData.newCustomers.toString(), style: 'tableData' }
                ],
                [
                  { text: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue', style: 'tableHeader' },
                  { text: `${formatCurrency(mockCustomerData.totalRevenue)} ${language === 'ar' ? 'ر.ق' : 'QAR'}`, style: 'tableData' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          },

          // Top Customers Section
          {
            text: language === 'ar' ? 'أفضل العملاء' : 'Top Customers',
            style: 'sectionHeader',
            alignment: language === 'ar' ? 'right' : 'left'
          },
          {
            table: {
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: language === 'ar' ? 'اسم العميل' : 'Customer Name', style: 'tableHeader' },
                  { text: language === 'ar' ? 'الإيرادات' : 'Revenue', style: 'tableHeader' },
                  { text: language === 'ar' ? 'الاتفاقيات' : 'Agreements', style: 'tableHeader' }
                ],
                ...mockCustomerData.topCustomers.map(customer => [
                  { text: customer.name, style: 'tableData' },
                  { text: `${formatCurrency(customer.revenue)} ${language === 'ar' ? 'ر.ق' : 'QAR'}`, style: 'tableData' },
                  { text: customer.agreements.toString(), style: 'tableData' }
                ])
              ]
            },
            layout: 'lightHorizontalLines'
          }
        ],
        
        styles: {
          header: {
            fontSize: 20,
            bold: true,
            margin: [0, 0, 0, 10],
            color: '#1a365d'
          },
          subheader: {
            fontSize: 12,
            color: '#4a5568'
          },
          sectionHeader: {
            fontSize: 16,
            bold: true,
            margin: [0, 20, 0, 10],
            color: '#2d3748'
          },
          tableHeader: {
            bold: true,
            fontSize: 12,
            color: '#2d3748',
            fillColor: '#f7fafc'
          },
          tableData: {
            fontSize: 11,
            margin: [0, 2, 0, 2]
          }
        },
        
        defaultStyle: {
          font: fontName,
          fontSize: 11,
          lineHeight: 1.4
        },
        
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        
        header: {
          text: language === 'ar' ? 'تقرير العملاء المالي' : 'Customer Financial Report',
          alignment: 'center',
          fontSize: 10,
          color: '#666666',
          margin: [0, 20, 0, 0]
        },
        
        footer: function(currentPage: number, pageCount: number) {
          return {
            text: `${language === 'ar' ? 'صفحة' : 'Page'} ${currentPage} ${language === 'ar' ? 'من' : 'of'} ${pageCount}`,
            alignment: 'center',
            fontSize: 10,
            color: '#666666'
          };
        }
      };

      // Generate PDF safely with font handling
      await generatePDFSafely(documentDefinition, {
        filename: `customer-report-${new Date().toISOString().split('T')[0]}.pdf`,
        preferArabic: language === 'ar',
        timeout: 15000 // 15 second timeout
      });

      toast.success(language === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Report generated successfully');
      
    } catch (error) {
      console.error('Error generating customer report:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء التقرير' : 'Error generating report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* PDF System Status Indicator */}
      {pdfSystemStatus.loading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span className="text-sm text-yellow-800">
                {language === 'ar' ? 'جاري تحميل خطوط PDF...' : 'Loading PDF fonts...'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <Users className="h-5 w-5" />
            {language === 'ar' ? 'تقرير العملاء' : 'Customer Report'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'إنشاء تقارير مفصلة عن العملاء والأداء المالي' : 'Generate detailed customer and financial performance reports'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="customer-select">
                {language === 'ar' ? 'اختيار العميل' : 'Select Customer'}
              </Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select Customer'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع العملاء' : 'All Customers'}</SelectItem>
                  <SelectItem value="active">{language === 'ar' ? 'العملاء النشطون' : 'Active Customers'}</SelectItem>
                  <SelectItem value="new">{language === 'ar' ? 'العملاء الجدد' : 'New Customers'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="report-type">
                {language === 'ar' ? 'نوع التقرير' : 'Report Type'}
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر نوع التقرير' : 'Select Report Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">{language === 'ar' ? 'تقرير ملخص' : 'Summary Report'}</SelectItem>
                  <SelectItem value="detailed">{language === 'ar' ? 'تقرير مفصل' : 'Detailed Report'}</SelectItem>
                  <SelectItem value="financial">{language === 'ar' ? 'تقرير مالي' : 'Financial Report'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className={language === 'ar' ? 'text-right' : ''}>
            <Label>{language === 'ar' ? 'نطاق التاريخ' : 'Date Range'}</Label>
            <DatePickerWithRange 
              date={dateRange} 
              onDateChange={setDateRange}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : ''}`}>
              {mockCustomerData.totalCustomers}
            </div>
            <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? '+7 من الشهر الماضي' : '+7 from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'العملاء النشطون' : 'Active Customers'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : ''}`}>
              {mockCustomerData.activeCustomers}
            </div>
            <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? '84% من إج1مالي العملاء' : '84% of total customers'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : ''}`}>
              {formatCurrency(mockCustomerData.totalRevenue)}
            </div>
            <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'ر.ق قطري' : 'QAR'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'متوسط الإيجار' : 'Average Rental'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : ''}`}>
              {formatCurrency(mockCustomerData.averageRental)}
            </div>
            <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'لكل اتفاقية' : 'per agreement'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report Button */}
      <Card>
        <CardContent className="pt-6">
          <div className={`flex gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button 
              onClick={generateCustomerFinancialReport}
              disabled={isGenerating}
              className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGenerating ? 
                (language === 'ar' ? 'جاري الإنشاء...' : 'Generating...') :
                (language === 'ar' ? 'إنشاء تقرير PDF' : 'Generate PDF Report')
              }
            </Button>
            
            <div className={`text-sm text-muted-foreground flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <span>
                {language === 'ar' ? 
                  `الخطوط المتاحة: ${pdfSystemStatus.fonts.join(', ')}` :
                  `Available fonts: ${pdfSystemStatus.fonts.join(', ')}`
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerReport;
