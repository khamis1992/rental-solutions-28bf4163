import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Users, 
  FileText, 
  DollarSign, 
  Clock, 
  Gavel,
  Eye,
  Plus,
  Search,
  Download,
  Send,
  TrendingUp,
  AlertCircle,
  Car,
  Calendar,
  CreditCard,
  Printer,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  legalManagementService,
  LegalCandidate,
  LegalCase,
  LegalTemplate,
  UnpaidAgreement,
  UnpaidTrafficFine
} from '@/services/LegalManagementService';
import AILegalLetterGenerator from './AILegalLetterGenerator';

const LegalManagementDashboard = () => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [legalCandidates, setLegalCandidates] = useState<LegalCandidate[]>([]);
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [legalTemplates, setLegalTemplates] = useState<LegalTemplate[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<LegalCandidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // Dialog states
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Ref for PDF export
  const detailsContentRef = useRef<HTMLDivElement>(null);
  
  // Form states
  const [newCaseForm, setNewCaseForm] = useState({
    case_type: 'payment_collection' as const,
    notes: ''
  });
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    type: 'demand_letter' as const,
    content: '',
    variables: [] as string[]
  });

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [candidatesResult, statsResult, templatesResult] = await Promise.all([
        legalManagementService.generateLegalCandidates(),
        legalManagementService.getDashboardStats(),
        legalManagementService.getLegalTemplates()
      ]);

      if (candidatesResult.success) {
        setLegalCandidates(candidatesResult.data);
      }
      
      if (statsResult.success) {
        setDashboardStats(statsResult.data);
      }
      
      if (templatesResult.success) {
        setLegalTemplates(templatesResult.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load legal management data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCase = async () => {
    if (!selectedCandidate) return;
    
    try {
      const result = await legalManagementService.createLegalCase(
        selectedCandidate.customer_id,
        newCaseForm.case_type,
        selectedCandidate.total_amount_owed,
        newCaseForm.notes
      );
      
      if (result.success) {
        toast.success('Legal case created successfully');
        setShowCaseDialog(false);
        setSelectedCandidate(null);
        loadDashboardData();
      } else {
        throw new Error('Failed to create case');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create legal case');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const result = await legalManagementService.createLegalTemplate(
        newTemplateForm.name,
        newTemplateForm.type,
        newTemplateForm.content,
        newTemplateForm.variables
      );
      
      if (result.success) {
        toast.success('Legal template created successfully');
        setShowTemplateDialog(false);
        setNewTemplateForm({
          name: '',
          type: 'demand_letter',
          content: '',
          variables: []
        });
        loadDashboardData();
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create legal template');
    }
  };

  const handleViewDetails = (candidate: LegalCandidate) => {
    setSelectedCandidate(candidate);
    setShowDetailsDialog(true);
  };

  const handleExportToPDF = async () => {
    if (!selectedCandidate) {
      console.error('No selected candidate for PDF export');
      toast.error('لم يتم اختيار عميل للتصدير');
      return;
    }
    
    console.log('Starting PDF export for candidate:', selectedCandidate.customer_name);
    setIsExporting(true);
    
    try {
      // Calculate totals for the complaint
      const totalRentAmount = selectedCandidate.unpaid_agreements.reduce((sum, agreement) => sum + agreement.amount_owed, 0);
      const totalLateFees = selectedCandidate.unpaid_agreements.reduce((sum, agreement) => sum + (agreement.days_overdue * 10), 0);
      const totalTrafficFines = selectedCandidate.unpaid_traffic_fines.reduce((sum, fine) => sum + fine.fine_amount, 0);
      const compensationAmount = 2000;
      const totalClaimAmount = totalRentAmount + totalLateFees + totalTrafficFines + compensationAmount;

      // Get first agreement for contract details
      const firstAgreement = selectedCandidate.unpaid_agreements[0];
      const agreementDate = 'غير محدد'; // We don't have start_date in the interface
      const monthlyRent = firstAgreement ? Math.round(firstAgreement.amount_owed / Math.max(1, Math.ceil(firstAgreement.days_overdue / 30))) : 0; // Estimate monthly rent

      // Calculate overdue months for display
      const getOverdueMonths = () => {
        if (!firstAgreement) return 'غير محدد';
        
        const monthsOverdue = Math.ceil(firstAgreement.days_overdue / 30);
        const monthNames = [
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        
        const currentMonth = new Date().getMonth();
        const overdueMonthsList = [];
        
        for (let i = monthsOverdue - 1; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          overdueMonthsList.push(`شهر ${monthNames[monthIndex]}`);
        }
        
        return overdueMonthsList.join(', ');
      };

      console.log('Calculated totals:', {
        totalRentAmount,
        totalLateFees,
        totalTrafficFines,
        totalClaimAmount,
        agreementDate,
        monthlyRent,
        overdueMonths: getOverdueMonths()
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>شكوى قانونية - ${selectedCandidate.customer_name}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
              direction: rtl;
              text-align: right;
              margin: 0;
              padding: 20px;
              line-height: 1.8;
              color: #333;
              background: white;
              font-size: 14px;
            }
            .company-header {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0;
              color: #000;
            }
            .title {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin: 30px 0;
              text-decoration: underline;
            }
            .greeting {
              margin: 20px 0;
              font-size: 16px;
              font-weight: bold;
            }
            .paragraph {
              margin: 15px 0;
              text-align: justify;
              line-height: 2;
            }
            .company-info {
              margin: 20px 0;
              padding: 15px;
              background: #f9f9f9;
              border-right: 4px solid #333;
            }
            .vehicle-info {
              margin: 20px 0;
              border: 2px solid #333;
              padding: 15px;
            }
            .vehicle-table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            .vehicle-table th, .vehicle-table td {
              border: 1px solid #333;
              padding: 8px;
              text-align: center;
            }
            .vehicle-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .amount {
              color: #d32f2f;
              font-weight: bold;
            }
            .legal-article {
              background: #fff3cd;
              padding: 15px;
              margin: 20px 0;
              border-right: 4px solid #ffc107;
            }
            .requests {
              margin: 20px 0;
            }
            .requests ol {
              padding-right: 20px;
            }
            .requests li {
              margin: 8px 0;
            }
            .signature {
              margin-top: 40px;
              text-align: center;
            }
            .print-button {
              position: fixed;
              top: 20px;
              left: 20px;
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              z-index: 1000;
            }
            .print-button:hover {
              background: #0056b3;
            }
            @media print {
              body { print-color-adjust: exact; }
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">طباعة / حفظ PDF</button>
          
          <div class="company-header">
            شركة العراف لتأجير السيارات
          </div>
          
          <div class="title">
            الموضوع / شكوى ضد السيد / ${selectedCandidate.customer_name}
          </div>

          <div class="greeting">
            السلام عليكم ورحمة الله وبركاته.
          </div>

          <div class="paragraph">
            أما بعد.
          </div>

          <div class="paragraph">
            نتوجه إليكم نحن شركة العراف لتأجير السيارات، والكائن مقرها بدائرة اختصاصكم - أم صلال منطقة 71 مبنى 79 الشارع التجاري.
          </div>

          <div class="paragraph">
            نتقدم بشكوى ضد السيد / <strong>${selectedCandidate.customer_name}</strong> - الجنسية ${selectedCandidate.customer_nationality || 'غير محدد'} – رقم رخصة القيادة ${selectedCandidate.driving_license_number || selectedCandidate.customer_id} رقم الهاتف ${selectedCandidate.customer_phone || 'غير محدد'}
          </div>

          ${selectedCandidate.unpaid_agreements.length > 0 ? `
          <div class="vehicle-info">
            <h3 style="text-align: center; margin-bottom: 15px;">معلومات المركبة</h3>
            <table class="vehicle-table">
              <thead>
                <tr>
                  <th>رقم اللوحة</th>
                  <th>نوع المركبة</th>
                  <th>موديل</th>
                  <th>الإيجار الشهري</th>
                </tr>
              </thead>
              <tbody>
                ${selectedCandidate.unpaid_agreements.map(agreement => `
                  <tr>
                    <td>${agreement.vehicle_license_plate}</td>
                    <td>${agreement.vehicle_type || 'غير محدد'}</td>
                    <td>${agreement.vehicle_model || 'غير محدد'}</td>
                    <td class="amount">${monthlyRent.toLocaleString()} ريال</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="paragraph">
            المشكو ضده استأجر السيارة أعلاه بموجب عقد بتاريخ <strong>${agreementDate}</strong> بقيمة أجرة شهرية مبلغ <span class="amount">${monthlyRent.toLocaleString()}</span> ريال وتأخر وامتنع عن سداد مستحقات الأجرة بالرغم من المطالبة ومازالت السيارة في حوزته ورفض ردها للشركة على الرغم من انتهاء العقد:
          </div>

          <div class="paragraph">
            قيمة المتأخرات المترصدة في ذمته <span class="amount">${totalRentAmount.toLocaleString()}</span> ريال عن ${getOverdueMonths()}، غرامات التأخير <span class="amount">${totalLateFees.toLocaleString()}</span> ريال
          </div>

          <div class="paragraph">
            قيمة المخالفات المرورية <span class="amount">${totalTrafficFines.toLocaleString()}</span> ريال، تعويض جابر للضرر <span class="amount">${compensationAmount.toLocaleString()}</span> ريال، مجموع المطالبة <span class="amount">${totalClaimAmount.toLocaleString()}</span> ريال
          </div>

          <div class="paragraph">
            وبناء على ما سبق أتطلع من سيادتكم القيام بإتخاذ الإجراءات القانونية اللازمة لمقاضاة المشكو ضده وأطالب بحق الشركة القانوني.
          </div>

          <div class="legal-article">
            <strong>المشكو ضده خالف المادة (349) من القانون رقم 11 لسنة 2004</strong>
            <br><br>
            يُعاقب بالحبس مدة لا تجاوز ثلاث سنوات، وبالغرامة التي لا تزيد على ثلاثة آلاف ريال، أو بإحدى هاتين العقوبتين، كل من تناول طعاماً أو شراباً في محل معد لذلك ولو كان مقيماً فيه، وكذلك كل من شغل غرفة أو أكثر في فندق أو نحوه، أو استأجر وسيلة نقل معدة للإيجار، أو حصل على وقود لوسيلة نقل، مع علمه أنه يستحيل عليه دفع الثمن أو الأجرة، أو امتنع بغير مبرر عن دفع ما استحق عليه من ذلك، أو فر دون الوفاء به
          </div>

          <div class="requests">
            <h3>الطلبات:</h3>
            <ol>
              <li>التعميم على المركبة</li>
              <li>تسليمنا السيارة في حالة توقيفها من قبل الشرطة بعد التعميم</li>
              <li>متأخرات الأجرة إلى حين التسليم</li>
              <li>قيمة مخالفات المرور إلى حين التسليم</li>
              <li>قيمة أي أضرار على السيارة إن وجدت</li>
              <li>غرامات التأخير</li>
              <li>تعويض الشركة لما تسبب من ضرر</li>
            </ol>
          </div>

          <div class="signature">
            <p>وقد فوضنا السيد / أسامة أحمد البشرى عبد المنعم رقم شخصي: 29273601820 لمتابعة وإنهاء كافة الإجراءات المتعلقة بالشكوى لدى إدارتكم</p>
          </div>
        </body>
        </html>
      `;

      console.log('HTML content generated, attempting to open window...');

      // Try to open popup window
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        console.error('Popup blocked, trying alternative method...');
        // Alternative method: Create a blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `شكوى-قانونية-${selectedCandidate.customer_name}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('تم تحميل ملف HTML - يمكنك فتحه وطباعته كـ PDF');
      } else {
        console.log('Popup window opened successfully');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Focus the window and trigger print after a short delay
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 1000);
        
        toast.success('تم فتح نافذة الطباعة - يمكنك حفظ التقرير كـ PDF');
      }
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast.error(`فشل في تصدير التقرير: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredCandidates = legalCandidates.filter(candidate =>
    // Filter out specific user IDs
    candidate.customer_id !== '912c00a6-8ce9-422a-824c-c93a3fce5aa2' &&
    candidate.customer_id !== '9232ab95-d282-419d-af85-0559c3798676' &&
    (candidate.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.customer_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading legal management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الشؤون القانونية</h1>
          <p className="text-muted-foreground">الكشف التلقائي والإدارة الشاملة للحالات القانونية</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline">
            تحديث البيانات
          </Button>
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                قالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء قالب قانوني جديد</DialogTitle>
                <DialogDescription>
                  أنشئ قالب جديد للوثائق القانونية
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="اسم القالب"
                  value={newTemplateForm.name}
                  onChange={(e) => setNewTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <Select
                  value={newTemplateForm.type}
                  onValueChange={(value: any) => setNewTemplateForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="نوع القالب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demand_letter">خطاب مطالبة</SelectItem>
                    <SelectItem value="court_notice">إشعار محكمة</SelectItem>
                    <SelectItem value="settlement_offer">عرض تسوية</SelectItem>
                    <SelectItem value="payment_reminder">تذكير دفع</SelectItem>
                    <SelectItem value="legal_notice">إنذار قانوني</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="محتوى القالب (استخدم {{variable_name}} للمتغيرات)"
                  value={newTemplateForm.content}
                  onChange={(e) => setNewTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[200px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    إنشاء القالب
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>



      {/* Dashboard Statistics */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المرشحون للإجراءات القانونية</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_candidates}</div>
              <p className="text-xs text-muted-foreground">عميل يحتاج متابعة</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">القضايا النشطة</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_cases}</div>
              <p className="text-xs text-muted-foreground">قضية مفتوحة</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المبلغ المعرض للخطر</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.total_amount_at_risk.toLocaleString()} ر.ق
              </div>
              <p className="text-xs text-muted-foreground">إجمالي المبالغ المستحقة</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">القوالب النشطة</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{legalTemplates.length}</div>
              <p className="text-xs text-muted-foreground">قالب متاح</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="candidates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">إدارة القوالب</TabsTrigger>
          <TabsTrigger value="cases">القضايا النشطة</TabsTrigger>
          <TabsTrigger value="candidates">المرشحون للإجراءات القانونية</TabsTrigger>
        </TabsList>

        {/* Legal Candidates Tab */}
        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>الكشف التلقائي - المرشحون للإجراءات القانونية</CardTitle>
                  <CardDescription>
                    العملاء الذين لديهم التزامات مالية متأخرة تستدعي اتخاذ إجراءات قانونية
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث عن عميل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد حالات تستدعي إجراءات قانونية حالياً</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الإجراءات</TableHead>
                      <TableHead>الإجراء المقترح</TableHead>
                      <TableHead>نقاط الأولوية</TableHead>
                      <TableHead>المبلغ المستحق</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>العميل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowCaseDialog(true);
                              }}
                            >
                              <Gavel className="w-4 h-4 mr-1" />
                              فتح قضية
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDetails(candidate)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              عرض التفاصيل
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{candidate.recommended_action}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full" 
                                style={{ width: `${candidate.priority_score}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{candidate.priority_score}/100</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">
                            {candidate.total_amount_owed.toLocaleString()} ر.ق
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {candidate.type === 'unpaid_agreement' && 'إيجار متأخر'}
                            {candidate.type === 'unpaid_traffic_fine' && 'مخالفات مرورية'}
                            {candidate.type === 'combined' && 'مختلط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{candidate.customer_name}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>القضايا القانونية النشطة</CardTitle>
              <CardDescription>إدارة ومتابعة القضايا القانونية المفتوحة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">ستتم إضافة إدارة القضايا في المرحلة التالية</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Tabs defaultValue="ai-generator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai-generator" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                مولد الخطابات بالذكاء الاصطناعي
              </TabsTrigger>
              <TabsTrigger value="traditional-templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                القوالب التقليدية
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai-generator" className="mt-6">
              <AILegalLetterGenerator />
            </TabsContent>
            
            <TabsContent value="traditional-templates" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة القوالب القانونية</CardTitle>
                  <CardDescription>إنشاء وإدارة قوالب الوثائق القانونية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {legalTemplates.map((template) => (
                      <Card key={template.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <Badge variant="outline" className="mt-1">
                                {template.type === 'demand_letter' && 'خطاب مطالبة'}
                                {template.type === 'court_notice' && 'إشعار محكمة'}
                                {template.type === 'settlement_offer' && 'عرض تسوية'}
                                {template.type === 'payment_reminder' && 'تذكير دفع'}
                                {template.type === 'legal_notice' && 'إنذار قانوني'}
                              </Badge>
                            </div>
                            <Badge variant={template.is_active ? 'default' : 'secondary'}>
                              {template.is_active ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            المتغيرات: {template.variables.join(', ')}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              عرض
                            </Button>
                            <Button size="sm" variant="outline">
                              تعديل
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Create Legal Case Dialog */}
      <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>فتح قضية قانونية جديدة</DialogTitle>
            <DialogDescription>
              فتح قضية قانونية ضد العميل: {selectedCandidate?.customer_name}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">تفاصيل العميل:</h4>
                <p>الاسم: {selectedCandidate.customer_name}</p>
                <p>المبلغ المستحق: {selectedCandidate.total_amount_owed.toLocaleString()} ر.ق</p>
                <p>الإجراء المقترح: {selectedCandidate.recommended_action}</p>
              </div>
              
              <Select
                value={newCaseForm.case_type}
                onValueChange={(value: any) => setNewCaseForm(prev => ({ ...prev, case_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="نوع القضية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_collection">تحصيل مدفوعات</SelectItem>
                  <SelectItem value="traffic_fine_collection">تحصيل مخالفات مرورية</SelectItem>
                  <SelectItem value="contract_breach">خرق عقد</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
              
              <Textarea
                placeholder="ملاحظات إضافية..."
                value={newCaseForm.notes}
                onChange={(e) => setNewCaseForm(prev => ({ ...prev, notes: e.target.value }))}
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCaseDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateCase}>
                  فتح القضية
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>تفاصيل العميل - {selectedCandidate?.customer_name}</DialogTitle>
                <DialogDescription>
                  معلومات شاملة عن الالتزامات المالية المتأخرة
                </DialogDescription>
              </div>
              <Button
                onClick={handleExportToPDF}
                disabled={isExporting}
                variant="outline"
                size="sm"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                تصدير PDF للمحكمة
              </Button>
            </div>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6" ref={detailsContentRef}>
              {/* Customer Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">إجمالي المبلغ المستحق</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedCandidate.total_amount_owed.toLocaleString()} ر.ق
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">نقاط الأولوية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedCandidate.priority_score}/100
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">نوع الحالة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="text-sm">
                      {selectedCandidate.type === 'unpaid_agreement' && 'إيجار متأخر'}
                      {selectedCandidate.type === 'unpaid_traffic_fine' && 'مخالفات مرورية'}
                      {selectedCandidate.type === 'combined' && 'مختلط'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Recommended Action */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>الإجراء المقترح</AlertTitle>
                <AlertDescription>
                  {selectedCandidate.recommended_action}
                </AlertDescription>
              </Alert>

              {/* Unpaid Agreements */}
              {selectedCandidate.unpaid_agreements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      عقود الإيجار المتأخرة ({selectedCandidate.unpaid_agreements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم اللوحة</TableHead>
                          <TableHead>مبلغ الإيجار</TableHead>
                          <TableHead>إجمالي الغرامات المتأخرة</TableHead>
                          <TableHead>الأشهر المعلقة غير المدفوعة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCandidate.unpaid_agreements.map((agreement) => (
                          <TableRow key={agreement.id}>
                            <TableCell className="font-medium">
                              {agreement.vehicle_license_plate}
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-red-600">
                                {agreement.amount_owed.toLocaleString()} ر.ق
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {agreement.days_overdue * 10} ر.ق
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {Math.ceil(agreement.days_overdue / 30)} شهر
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Unpaid Traffic Fines */}
              {selectedCandidate.unpaid_traffic_fines.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      المخالفات المرورية المتأخرة ({selectedCandidate.unpaid_traffic_fines.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم المخالفة</TableHead>
                          <TableHead>رقم اللوحة</TableHead>
                          <TableHead>مبلغ الغرامة</TableHead>
                          <TableHead>تاريخ المخالفة</TableHead>
                          <TableHead>إجمالي الغرامات المتأخرة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCandidate.unpaid_traffic_fines.map((fine) => (
                          <TableRow key={fine.id}>
                            <TableCell className="font-medium">
                              {fine.violation_number}
                            </TableCell>
                            <TableCell>{fine.license_plate}</TableCell>
                            <TableCell>
                              <span className="font-bold text-red-600">
                                {fine.fine_amount.toLocaleString()} ر.ق
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(fine.violation_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {fine.days_overdue * 5} ر.ق
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  إغلاق
                </Button>
                <Button 
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowCaseDialog(true);
                  }}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  فتح قضية قانونية
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegalManagementDashboard; 