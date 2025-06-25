import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import '@/styles/legal-rtl.css';
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
import LegalCaseManagement from './LegalCaseManagement';
import '@/styles/legal-rtl.css';
import '@/styles/legal-rtl.css';
import { supabase } from '@/lib/supabase';

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
      // Fetch actual agreement details from database
      let actualAgreementData = null;
      let actualVehicleData = null;
      let actualCustomerData = null;
      let pendingPayments = [];
      
      if (selectedCandidate.unpaid_agreements.length > 0) {
        const firstAgreement = selectedCandidate.unpaid_agreements[0];
        
        // Fetch full agreement details
        const { data: agreementDetails, error: agreementError } = await supabase
          .from('leases')
          .select(`
            *,
            vehicles(*),
            customers(*)
          `)
          .eq('id', firstAgreement.agreement_id)
          .single();
          
        if (!agreementError && agreementDetails) {
          actualAgreementData = agreementDetails;
          actualVehicleData = agreementDetails.vehicles;
          actualCustomerData = agreementDetails.customers;
          
          // Fetch pending payments for this agreement
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('lease_id', firstAgreement.agreement_id)
            .eq('status', 'pending')
            .order('due_date', { ascending: true });
            
          if (!paymentsError && paymentsData) {
            pendingPayments = paymentsData;
          }
        }
      }

      // Calculate totals for the complaint
      const totalRentAmount = selectedCandidate.unpaid_agreements.reduce((sum, agreement) => sum + agreement.amount_owed, 0);
      const totalTrafficFines = selectedCandidate.unpaid_traffic_fines.reduce((sum, fine) => sum + fine.fine_amount, 0);
      
      // Calculate late fees with 120 QAR per day
      const totalDaysOverdue = selectedCandidate.unpaid_agreements.reduce((sum, agreement) => sum + agreement.days_overdue, 0);
      const totalLateFees = totalDaysOverdue * 120; // 120 QAR per day as requested
      
      const compensationAmount = 2000;
      const totalClaimAmount = totalRentAmount + totalLateFees + totalTrafficFines + compensationAmount;

      // Use actual agreement data
      const actualMonthlyRent = actualAgreementData?.rent_amount || 
        (selectedCandidate.unpaid_agreements[0] ? 
          Math.round(selectedCandidate.unpaid_agreements[0].amount_owed / Math.max(1, Math.ceil(selectedCandidate.unpaid_agreements[0].days_overdue / 30))) : 
          0);
      
      const agreementDate = actualAgreementData?.start_date ? 
        new Date(actualAgreementData.start_date).toLocaleDateString('ar-QA') : 
        'غير محدد';

      // Generate pending payments table
      const generatePendingPaymentsTable = () => {
        if (pendingPayments.length === 0) {
          return `
            <tr>
              <td colspan="3" style="text-align: center; color: #666;">لا توجد مدفوعات معلقة</td>
            </tr>
          `;
        }
        
        return pendingPayments.map(payment => {
          const dueDate = new Date(payment.due_date).toLocaleDateString('ar-QA');
          const description = payment.description || `أجرة شهر ${dueDate}`;
          
          return `
            <tr>
              <td style="text-align: center;">${description}</td>
              <td style="text-align: center;">${dueDate}</td>
              <td style="text-align: center;" class="amount">${payment.amount.toLocaleString()} ر.ق</td>
            </tr>
          `;
        }).join('');
      };

      console.log('Calculated totals:', {
        totalRentAmount,
        totalLateFees,
        totalTrafficFines,
        totalClaimAmount,
        agreementDate,
        actualMonthlyRent,
        totalDaysOverdue,
        pendingPaymentsCount: pendingPayments.length
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
            .vehicle-table, .payments-table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            .vehicle-table th, .vehicle-table td, .payments-table th, .payments-table td {
              border: 1px solid #333;
              padding: 8px;
              text-align: center;
            }
            .vehicle-table th, .payments-table th {
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
            .payments-section {
              margin: 20px 0;
              border: 2px solid #333;
              padding: 15px;
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
            نتقدم بشكوى ضد السيد / <strong>${selectedCandidate.customer_name}</strong> - الجنسية ${actualCustomerData?.nationality || selectedCandidate.customer_nationality || 'غير محدد'} – رقم رخصة القيادة ${actualCustomerData?.driver_license || selectedCandidate.driving_license_number || selectedCandidate.customer_id} رقم الهاتف ${actualCustomerData?.phone_number || selectedCandidate.customer_phone || 'غير محدد'}
          </div>

          ${selectedCandidate.unpaid_agreements.length > 0 ? `
          <div class="vehicle-info">
            <h3 style="text-align: center; margin-bottom: 15px;">معلومات المركبة من العقد</h3>
            <table class="vehicle-table">
              <thead>
                <tr>
                  <th>رقم اللوحة</th>
                  <th>الماركة</th>
                  <th>الموديل</th>
                  <th>سنة الصنع</th>
                  <th>اللون</th>
                  <th>الإيجار الشهري</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${actualVehicleData?.license_plate || selectedCandidate.unpaid_agreements[0].vehicle_license_plate}</td>
                  <td>${actualVehicleData?.make || 'غير محدد'}</td>
                  <td>${actualVehicleData?.model || 'غير محدد'}</td>
                  <td>${actualVehicleData?.year || 'غير محدد'}</td>
                  <td>${actualVehicleData?.color || 'غير محدد'}</td>
                  <td class="amount">${actualMonthlyRent.toLocaleString()} ر.ق</td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="paragraph">
            المشكو ضده استأجر السيارة أعلاه بموجب عقد بتاريخ <strong>${agreementDate}</strong> بقيمة أجرة شهرية مبلغ <span class="amount">${actualMonthlyRent.toLocaleString()}</span> ريال وتأخر وامتنع عن سداد مستحقات الأجرة بالرغم من المطالبة ومازالت السيارة في حوزته ورفض ردها للشركة على الرغم من انتهاء العقد.
          </div>

          ${pendingPayments.length > 0 ? `
          <div class="payments-section">
            <h3 style="text-align: center; margin-bottom: 15px;">تفاصيل الأشهر المتأخرة (المعلقة)</h3>
            <table class="payments-table">
              <thead>
                <tr>
                  <th>الوصف</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                ${generatePendingPaymentsTable()}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="paragraph">
            قيمة المتأخرات المترصدة في ذمته <span class="amount">${totalRentAmount.toLocaleString()}</span> ريال، غرامات التأخير بواقع 120 ريال لكل يوم تأخير (${totalDaysOverdue} يوم) = <span class="amount">${totalLateFees.toLocaleString()}</span> ريال
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
              <li>غرامات التأخير بواقع 120 ريال لكل يوم تأخير</li>
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
    return "bg-white";
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">Loading legal management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 legal-rtl" dir="rtl">
      {/* Header */}
              <div className="flex justify-between items-center" dir="rtl">
          <div className="text-right">
            <h1 className="text-2xl font-bold text-right">إدارة الشؤون القانونية</h1>
            <p className="text-muted-foreground text-right text-sm">الكشف التلقائي والإدارة الشاملة للحالات القانونية</p>
          </div>
        <div className="flex gap-2" dir="rtl">
          <Button onClick={loadDashboardData} variant="outline" className="h-9 text-sm">
            تحديث البيانات
          </Button>
        </div>
      </div>



      {/* Dashboard Statistics */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3" dir="rtl">
          <Card className="text-right">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" dir="rtl">
              <CardTitle className="text-sm font-medium text-right">المرشحون للإجراءات القانونية</CardTitle>
              <Users className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-right">
              <div className="text-xl font-bold text-right">{dashboardStats.total_candidates}</div>
              <p className="text-xs text-muted-foreground text-right">عميل يحتاج متابعة</p>
            </CardContent>
          </Card>
          
          <Card className="text-right">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" dir="rtl">
              <CardTitle className="text-sm font-medium text-right">القضايا النشطة</CardTitle>
              <Gavel className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-right">
              <div className="text-xl font-bold text-right">{dashboardStats.total_cases}</div>
              <p className="text-xs text-muted-foreground text-right">قضية مفتوحة</p>
            </CardContent>
          </Card>
          
          <Card className="text-right">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" dir="rtl">
              <CardTitle className="text-sm font-medium text-right">المبلغ المعرض للخطر</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-right">
              <div className="text-xl font-bold text-right">
                {dashboardStats.total_amount_at_risk.toLocaleString()} ر.ق
              </div>
              <p className="text-xs text-muted-foreground text-right">إجمالي المبالغ المستحقة</p>
            </CardContent>
          </Card>
          
          <Card className="text-right">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" dir="rtl">
              <CardTitle className="text-sm font-medium text-right">القوالب النشطة</CardTitle>
              <FileText className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-right">
              <div className="text-xl font-bold text-right">{legalTemplates.length}</div>
              <p className="text-xs text-muted-foreground text-right">قالب متاح</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="candidates" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3" dir="rtl">
          <TabsTrigger value="candidates" className="text-sm">المرشحون للإجراءات القانونية</TabsTrigger>
          <TabsTrigger value="cases" className="text-sm">القضايا النشطة</TabsTrigger>
          <TabsTrigger value="templates" className="text-sm">مولد الخطابات الذكي</TabsTrigger>
        </TabsList>

        {/* Legal Candidates Tab */}
        <TabsContent value="candidates" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center" dir="rtl">
                <div className="text-right">
                  <CardTitle className="text-right text-lg">الكشف التلقائي - المرشحون للإجراءات القانونية</CardTitle>
                  <CardDescription className="text-right text-sm">
                    العملاء الذين لديهم التزامات مالية متأخرة تستدعي اتخاذ إجراءات قانونية
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2" dir="rtl">
                  <Input
                    placeholder="البحث عن عميل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-60 text-right h-9 text-sm"
                  />
                  <Search className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">لا توجد حالات تستدعي إجراءات قانونية حالياً</p>
                </div>
              ) : (
                <Table dir="rtl" className="text-right">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right text-sm">العميل</TableHead>
                      <TableHead className="text-right text-sm">النوع</TableHead>
                      <TableHead className="text-right text-sm">المبلغ المستحق</TableHead>
                      <TableHead className="text-right text-sm">الإجراء المقترح</TableHead>
                      <TableHead className="text-right text-sm">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="text-right py-2">
                          <div>
                            <p className="font-medium text-sm">{candidate.customer_name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {candidate.type === 'unpaid_agreement' && 'إيجار متأخر'}
                            {candidate.type === 'unpaid_traffic_fine' && 'مخالفات مرورية'}
                            {candidate.type === 'combined' && 'مختلط'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <span className="font-bold text-red-600 text-sm">
                            {candidate.total_amount_owed.toLocaleString()} ر.ق
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <p className="text-xs">{candidate.recommended_action}</p>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex gap-2 justify-end" dir="rtl">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowCaseDialog(true);
                              }}
                              className="h-8 text-xs"
                            >
                              <Gavel className="w-3 h-3 ml-1" />
                              فتح قضية
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDetails(candidate)}
                              className="h-8 text-xs"
                            >
                              <Eye className="w-3 h-3 ml-1" />
                              عرض التفاصيل
                            </Button>
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
        <TabsContent value="cases" className="space-y-3">
          <LegalCaseManagement />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-3">
          <AILegalLetterGenerator />
        </TabsContent>
      </Tabs>

      {/* Create Legal Case Dialog */}
      <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">فتح قضية قانونية جديدة</DialogTitle>
            <DialogDescription className="text-sm">
              فتح قضية قانونية ضد العميل: {selectedCandidate?.customer_name}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium mb-2 text-sm">تفاصيل العميل:</h4>
                <p className="text-sm">الاسم: {selectedCandidate.customer_name}</p>
                <p className="text-sm">المبلغ المستحق: {selectedCandidate.total_amount_owed.toLocaleString()} ر.ق</p>
                <p className="text-sm">الإجراء المقترح: {selectedCandidate.recommended_action}</p>
              </div>
              
              <Select
                value={newCaseForm.case_type}
                onValueChange={(value: any) => setNewCaseForm(prev => ({ ...prev, case_type: value }))}
              >
                <SelectTrigger className="h-9 text-sm">
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
                className="text-sm"
              />
              
              <div className="flex justify-end gap-2" dir="rtl">
                <Button onClick={handleCreateCase} className="h-9 text-sm">
                  فتح القضية
                </Button>
                <Button variant="outline" onClick={() => setShowCaseDialog(false)} className="h-9 text-sm">
                  إلغاء
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
                <DialogTitle className="text-lg">تفاصيل العميل - {selectedCandidate?.customer_name}</DialogTitle>
                <DialogDescription className="text-sm">
                  معلومات شاملة عن الالتزامات المالية المتأخرة
                </DialogDescription>
              </div>
              <Button
                onClick={handleExportToPDF}
                disabled={isExporting}
                variant="outline"
                size="sm"
                className="h-9 text-sm"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary ml-2"></div>
                ) : (
                  <Download className="w-3 h-3 ml-2" />
                )}
                تصدير PDF للمحكمة
              </Button>
            </div>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-5" ref={detailsContentRef}>
              {/* Customer Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">إجمالي المبلغ المستحق</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-red-600">
                      {selectedCandidate.total_amount_owed.toLocaleString()} ر.ق
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
                <AlertTriangle className="h-3 w-3" />
                <AlertTitle className="text-sm">الإجراء المقترح</AlertTitle>
                <AlertDescription className="text-sm">
                  {selectedCandidate.recommended_action}
                </AlertDescription>
              </Alert>

              {/* Unpaid Agreements */}
              {selectedCandidate.unpaid_agreements.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Car className="h-4 w-4" />
                      عقود الإيجار المتأخرة ({selectedCandidate.unpaid_agreements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm">رقم اللوحة</TableHead>
                          <TableHead className="text-sm">مبلغ الإيجار</TableHead>
                          <TableHead className="text-sm">إجمالي الغرامات المتأخرة</TableHead>
                          <TableHead className="text-sm">الأشهر المعلقة غير المدفوعة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCandidate.unpaid_agreements.map((agreement) => (
                          <TableRow key={agreement.id}>
                            <TableCell className="font-medium text-sm py-2">
                              {agreement.vehicle_license_plate}
                            </TableCell>
                            <TableCell className="py-2">
                              <span className="font-bold text-red-600 text-sm">
                                {agreement.amount_owed.toLocaleString()} ر.ق
                              </span>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{agreement.days_overdue * 10} ر.ق</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{Math.ceil(agreement.days_overdue / 30)} شهر</span>
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
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-4 w-4" />
                      المخالفات المرورية المتأخرة ({selectedCandidate.unpaid_traffic_fines.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm">رقم المخالفة</TableHead>
                          <TableHead className="text-sm">رقم اللوحة</TableHead>
                          <TableHead className="text-sm">مبلغ الغرامة</TableHead>
                          <TableHead className="text-sm">تاريخ المخالفة</TableHead>
                          <TableHead className="text-sm">إجمالي الغرامات المتأخرة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCandidate.unpaid_traffic_fines.map((fine) => (
                          <TableRow key={fine.id}>
                            <TableCell className="font-medium text-sm py-2">
                              {fine.violation_number}
                            </TableCell>
                            <TableCell className="text-sm py-2">{fine.license_plate}</TableCell>
                            <TableCell className="py-2">
                              <span className="font-bold text-red-600 text-sm">
                                {fine.fine_amount.toLocaleString()} ر.ق
                              </span>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{formatDate(fine.violation_date)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{fine.days_overdue * 5} ر.ق</span>
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
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="h-9 text-sm">
                  إغلاق
                </Button>
                <Button 
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowCaseDialog(true);
                  }}
                  className="h-9 text-sm"
                >
                  <Gavel className="w-3 h-3 mr-2" />
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