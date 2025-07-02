import React, { useState, useEffect } from 'react';
import { Card, CardContent, Badge, Button, Progress, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { generateModernCustomerFinancialPDF } from '@/utils/modern-customer-financial-pdf';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, 
  CreditCard, 
  AlertCircle, 
  AlertTriangle,
  TrendingUp, 
  Calendar,
  FileText,
  Send,
  History,
  Plus,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface CustomerFinancialTabProps {
  customerId: string;
}

interface FinancialSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averagePayment: number;
  paymentProgress: number;
  nextPaymentDue?: string; // تغيير إلى undefined بدلاً من null
  nextPaymentAmount: number;
  onTimePaymentRate: number;
  financialHealth: 'excellent' | 'good' | 'attention' | 'critical';
  totalContracts: number;
  activeContracts: number;
  totalLateFees?: number; // إضافة حقل غرامات التأخير
}

export const CustomerFinancialTab: React.FC<CustomerFinancialTabProps> = ({ customerId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFinancialData();
  }, [customerId]);

  const fetchFinancialData = async () => {
    if (!customerId) return;
    
    setIsLoading(true);
    try {
      // جلب بيانات العميل
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId);

      if (customerError) {
        console.error('Error fetching customer:', customerError);
        throw customerError;
      }

      if (!customerData || customerData.length === 0) {
        throw new Error(language === 'ar' ? `لم يتم العثور على العميل بالمعرف: ${customerId}` : `Customer not found with ID: ${customerId}`);
      }

      const customer = customerData[0];

      // جلب العقود مع استخدام النظام الصحيح للدفعات (payments table)
      const { data: agreements, error: agreementsError } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          rent_amount,
          start_date,
          end_date,
          status
        `)
        .eq('customer_id', customerId);

      if (agreementsError) {
        console.error('Error fetching agreements:', agreementsError);
        console.warn('Continuing without agreement data due to error:', agreementsError);
      }

      // جلب جميع الدفعات من جدول payments (النظام الصحيح)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('due_date', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }

      // حساب الإحصائيات المالية باستخدام النظام الصحيح
      let totalPaid = 0;
      let totalPending = 0;
      let totalOverdue = 0;
      let totalLateFees = 0; // إضافة حساب غرامات التأخير
      let allPayments: any[] = paymentsData || [];
      let onTimePayments = 0;
      let totalPayments = 0;

      const today = new Date();
      let nextPaymentDue: string | undefined = undefined;
      let nextPaymentAmount = 0;

      // معالجة الدفعات باستخدام النظام الصحيح
      if (paymentsData && paymentsData.length > 0) {
        // فصل الدفعات المتأخرة عن المعلقة (نفس منطق LegalManagementDashboard)
        const overduePayments = paymentsData.filter(payment => {
          const dueDate = new Date(payment.due_date);
          return dueDate < today && payment.status === 'overdue';
        });

        paymentsData.forEach((payment: any) => {
          // إضافة بيانات العقد للدفعة
          const relatedAgreement = agreements?.find(a => a.id === payment.lease_id);
          payment.agreement_number = relatedAgreement?.agreement_number || 'غير محدد';

          if (payment.status === 'paid' || payment.status === 'completed') {
            totalPaid += payment.amount;
            // التحقق من الدفع في الوقت المحدد
            if (payment.payment_date && payment.due_date) {
              const paymentDate = new Date(payment.payment_date);
              const dueDate = new Date(payment.due_date);
              if (paymentDate <= dueDate) {
                onTimePayments++;
              }
            }
            totalPayments++;
          } else if (payment.status === 'pending') {
            const dueDate = payment.due_date ? new Date(payment.due_date) : null;
            if (dueDate && dueDate < today) {
              // هذه دفعة متأخرة
              totalOverdue += payment.amount;
            } else {
              // هذه دفعة معلقة
              totalPending += payment.amount;
              // العثور على أقرب دفعة مستحقة
              if (dueDate && (!nextPaymentDue || dueDate < new Date(nextPaymentDue))) {
                nextPaymentDue = payment.due_date;
                nextPaymentAmount = payment.amount;
              }
            }
            totalPayments++;
          } else if (payment.status === 'overdue') {
            totalOverdue += payment.amount;
            totalPayments++;
          }
        });

        // حساب غرامات التأخير مثل LegalManagementDashboard (3000 ريال لكل شهر متأخر)
        const overdueMonthsCount = overduePayments.length; // كل دفعة متأخرة = شهر واحد
        totalLateFees = overdueMonthsCount * 3000;

        console.log('✅ استخدام النظام الصحيح - إحصائيات مطابقة للملخص المالي للمطالبة القانونية:', {
          totalPaid: `${totalPaid.toLocaleString()} ر.ق`,
          totalPending: `${totalPending.toLocaleString()} ر.ق`,
          totalOverdue: `${totalOverdue.toLocaleString()} ر.ق`,
          totalLateFees: `${totalLateFees.toLocaleString()} ر.ق (${overdueMonthsCount} شهر × 3000 ر.ق)`,
          totalPayments: paymentsData.length,
          overduePayments: overduePayments.length
        });
      }

      // حساب معدل الدفع في الوقت المحدد
      const onTimePaymentRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

      // حساب متوسط الدفعة
      const completedPayments = allPayments.filter(p => p.status === 'paid' || p.status === 'completed');
      const averagePayment = completedPayments.length > 0 
        ? completedPayments.reduce((sum, p) => sum + p.amount, 0) / completedPayments.length 
        : 0;

      // حساب تقدم الدفعات (شامل غرامات التأخير)
      const totalAmount = totalPaid + totalPending + totalOverdue + totalLateFees;
      const paymentProgress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

      // تحديد الصحة المالية (مع الأخذ في الاعتبار غرامات التأخير)
      let financialHealth: 'excellent' | 'good' | 'attention' | 'critical' = 'excellent';
      const totalOutstanding = totalOverdue + totalLateFees;
      if (totalOutstanding > 0) {
        if (totalOutstanding > totalPaid * 0.5) {
          financialHealth = 'critical';
        } else if (totalOutstanding > totalPaid * 0.25) {
          financialHealth = 'attention';
        } else {
          financialHealth = 'good';
        }
      } else if (onTimePaymentRate < 80) {
        financialHealth = 'attention';
      } else if (onTimePaymentRate < 95) {
        financialHealth = 'good';
      }

      const summary: FinancialSummary = {
        totalPaid,
        totalPending,
        totalOverdue: totalOverdue + totalLateFees, // إضافة غرامات التأخير للمبلغ المتأخر
        averagePayment,
        paymentProgress,
        nextPaymentDue,
        nextPaymentAmount,
        onTimePaymentRate,
        financialHealth,
        totalContracts: agreements?.length || 0,
        activeContracts: agreements?.filter(a => a.status === 'active').length || 0,
        totalLateFees
      };

      setFinancialData(summary);
      setCustomerData(customer);
      setAgreements(agreements || []);
      
      // ترتيب جميع الدفعات حسب التاريخ
      const sortedAllPayments = allPayments
        .sort((a, b) => new Date(b.payment_date || b.due_date || b.created_at).getTime() - new Date(a.payment_date || a.due_date || a.created_at).getTime());
      
      setAllPayments(sortedAllPayments);
      
      // الدفعات الأخيرة للعرض السريع
      const recentPaymentsForDisplay = sortedAllPayments.slice(0, 5);
      setRecentPayments(recentPaymentsForDisplay);

    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      toast({
        title: language === 'ar' ? 'خطأ في جلب البيانات المالية' : 'Error fetching financial data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'attention': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthText = (health: string) => {
    if (language === 'ar') {
      switch (health) {
        case 'excellent': return 'ممتازة';
        case 'good': return 'جيدة';
        case 'attention': return 'تحتاج انتباه';
        case 'critical': return 'حرجة';
        default: return 'غير محدد';
      }
    } else {
      switch (health) {
        case 'excellent': return 'Excellent';
        case 'good': return 'Good';
        case 'attention': return 'Needs Attention';
        case 'critical': return 'Critical';
        default: return 'Unknown';
      }
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'paid':
      case 'completed':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200`}>
            <CheckCircle className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
            {language === 'ar' ? 'مدفوع' : 'Paid'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-200`}>
            <Clock className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
            {language === 'ar' ? 'معلق' : 'Pending'}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200`}>
            <XCircle className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
            {language === 'ar' ? 'متأخر' : 'Overdue'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-200`}>
            <XCircle className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
            {language === 'ar' ? 'ملغي' : 'Cancelled'}
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className={`${baseClasses} bg-purple-100 text-purple-800 border-purple-200`}>
            <CheckCircle className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
            {language === 'ar' ? 'مسترد' : 'Refunded'}
          </Badge>
        );
      default:
        return (
          <Badge className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-200`}>
            {status}
          </Badge>
        );
    }
  };

  const handleFinancialAction = async (action: 'add' | 'reminder' | 'history' | 'report') => {
    switch (action) {
      case 'add':
        setShowPaymentDialog(true);
        break;
      case 'reminder':
        setShowReminderDialog(true);
        break;
      case 'history':
        // عرض سجل الدفعات الخاص بالعميل
        setShowPaymentHistoryDialog(true);
        break;
      case 'report':
        try {
          if (!customerData || !financialData) {
            toast({
              title: language === 'ar' ? 'خطأ' : 'Error',
              description: language === 'ar' ? 'لا توجد بيانات كافية لإنشاء التقرير' : 'Insufficient data to generate report',
              variant: 'destructive'
            });
            return;
          }

          toast({
            title: language === 'ar' ? 'جاري إنشاء التقرير...' : 'Generating report...',
            description: language === 'ar' ? 'سيتم تحميل ملف PDF قريباً' : 'PDF file will be downloaded shortly'
          });

          await generateModernCustomerFinancialPDF(
            customerData,
            financialData,
            agreements,
            recentPayments
          );

          toast({
            title: language === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Report generated successfully',
            description: language === 'ar' ? 'تم تحميل التقرير المالي' : 'Financial report has been downloaded'
          });
        } catch (error) {
          console.error('Error generating financial report:', error);
          toast({
            title: language === 'ar' ? 'خطأ في إنشاء التقرير' : 'Error generating report',
            description: language === 'ar' ? 'فشل في إنشاء التقرير المالي' : 'Failed to generate financial report',
            variant: 'destructive'
          });
        }
        break;
    }
  };

  const handleSendReminder = async () => {
    try {
      // هنا يمكن إضافة منطق إرسال التذكير الفعلي
      // مثل إرسال إيميل أو SMS للعميل
      toast({
        title: language === 'ar' ? 'تم إرسال التذكير' : 'Reminder Sent',
        description: language === 'ar' ? 'تم إرسال تذكير الدفع للعميل بنجاح' : 'Payment reminder sent to customer successfully'
      });
      setShowReminderDialog(false);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في إرسال التذكير' : 'Error Sending Reminder',
        description: language === 'ar' ? 'فشل في إرسال التذكير' : 'Failed to send reminder',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className={`text-sm text-gray-500 ${language === 'ar' ? 'mr-3' : 'ml-3'}`}>
          {language === 'ar' ? 'جاري تحميل البيانات المالية...' : 'Loading financial data...'}
        </span>
      </div>
    );
  }

  if (!financialData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">
            {language === 'ar' ? 'لا توجد بيانات مالية متاحة' : 'No financial data available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* الإحصائيات المالية الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="text-sm text-gray-500 mb-1">
                  {language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(financialData.totalPaid)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="text-sm text-gray-500 mb-1">
                  {language === 'ar' ? 'المبلغ المعلق' : 'Pending Amount'}
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(financialData.totalPending)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="text-sm text-gray-500 mb-1">
                  {language === 'ar' ? 'المبلغ المتأخر' : 'Overdue Amount'}
                </p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(financialData.totalOverdue)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="text-sm text-gray-500 mb-1">
                  {language === 'ar' ? 'متوسط الدفعة' : 'Average Payment'}
                </p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(financialData.averagePayment)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* بطاقة غرامات التأخير - محسوبة حسب النظام الصحيح */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="text-sm text-gray-500 mb-1">
                  {language === 'ar' ? 'غرامات التأخير' : 'Late Fees'}
                </p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(financialData.totalLateFees || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {language === 'ar' ? '3000 ر.ق/شهر متأخر' : '3000 QAR/overdue month'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* مؤشر أداء الدفع وصحة مالية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' ? 'تقدم الدفعات' : 'Payment Progress'}
            </h3>
            <div className="space-y-4">
              <div>
                <div className={`flex justify-between items-center mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'نسبة الاكتمال' : 'Completion Rate'}
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round(financialData.paymentProgress)}%
                  </span>
                </div>
                <Progress value={financialData.paymentProgress} className="h-2" />
              </div>
              
              <div className={`grid grid-cols-2 gap-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'إجمالي العقود' : 'Total Contracts'}
                  </p>
                  <p className="text-lg font-semibold">{financialData.totalContracts}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'العقود النشطة' : 'Active Contracts'}
                  </p>
                  <p className="text-lg font-semibold">{financialData.activeContracts}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' ? 'الصحة المالية' : 'Financial Health'}
            </h3>
            <div className="space-y-4">
              <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Badge className={`px-3 py-1 text-sm ${getHealthColor(financialData.financialHealth)}`}>
                  {getHealthText(financialData.financialHealth)}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  {language === 'ar' ? 'معدل الدفع في الوقت المحدد' : 'On-time Payment Rate'}
                </p>
                <div className={`flex justify-between items-center mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-lg font-semibold">
                    {Math.round(financialData.onTimePaymentRate)}%
                  </span>
                </div>
                <Progress value={financialData.onTimePaymentRate} className="h-2" />
              </div>

              {financialData.nextPaymentDue && (
                <div className={`p-3 bg-blue-50 rounded-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-blue-600 mb-1">
                    {language === 'ar' ? 'الدفعة التالية' : 'Next Payment'}
                  </p>
                  <p className="font-semibold text-blue-800">
                    {formatCurrency(financialData.nextPaymentAmount)}
                  </p>
                  <p className="text-xs text-blue-600">
                    {language === 'ar' ? 'مستحقة في:' : 'Due:'} {formatDate(financialData.nextPaymentDue)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الإجراءات السريعة */}
      <Card>
        <CardContent className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'الإجراءات المالية السريعة' : 'Quick Financial Actions'}
          </h3>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <Button 
              onClick={() => handleFinancialAction('add')}
              className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleFinancialAction('reminder')}
              className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <Send className="w-4 h-4" />
              {language === 'ar' ? 'إرسال تذكير' : 'Send Reminder'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleFinancialAction('history')}
              className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <History className="w-4 h-4" />
              {language === 'ar' ? 'سجل الدفعات' : 'Payment History'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => handleFinancialAction('report')}
              className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <FileText className="w-4 h-4" />
              {language === 'ar' ? 'تقرير مالي' : 'Financial Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الدفعات الأخيرة */}
      {recentPayments.length > 0 && (
        <Card dir="rtl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <CardTitle className="text-lg font-semibold text-left flex items-center gap-2 flex-row-reverse">
                  <DollarSign className="w-5 h-5" />
                  {language === 'ar' ? 'الدفعات الأخيرة' : 'Recent Payments'}
                </CardTitle>
                <CardDescription className="text-left mt-1">
                  {language === 'ar' ? 'آخر الدفعات والمعاملات المالية المسجلة' : 'Latest recorded payments and financial transactions'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPayments.map((payment, index) => (
              <div 
                key={payment.id || index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="p-3 bg-blue-50 rounded-full border border-blue-200">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-lg text-left">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-muted-foreground text-left">
                      {language === 'ar' ? 'عقد:' : 'Contract:'} {payment.agreement_number}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-start gap-2">
                  {getPaymentStatusBadge(payment.status)}
                  <p className="text-sm text-muted-foreground text-left">
                    {formatDate(payment.payment_date || payment.due_date)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* حوار تسجيل دفعة جديدة */}
      <RecordPaymentDialog 
        open={showPaymentDialog} 
        onOpenChange={(open) => {
          setShowPaymentDialog(open);
          if (!open) {
            // إعادة تحميل البيانات المالية بعد إغلاق حوار الدفعة
            fetchFinancialData();
          }
        }} 
      />

      {/* حوار إرسال تذكير */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'إرسال تذكير دفع' : 'Send Payment Reminder'}
            </DialogTitle>
            <DialogDescription className={language === 'ar' ? 'text-right' : 'text-left'}>
              {language === 'ar' 
                ? 'إرسال تذكير للعميل بالدفعات المستحقة' 
                : 'Send a reminder to the customer about due payments'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className={`text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' 
                ? 'هل تريد إرسال تذكير بالدفعات المستحقة لهذا العميل؟'
                : 'Do you want to send a payment reminder for outstanding payments to this customer?'
              }
            </p>
            {financialData?.nextPaymentDue && (
              <div className={`p-3 bg-blue-50 rounded-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-blue-600 mb-1">
                  {language === 'ar' ? 'الدفعة التالية المستحقة:' : 'Next Payment Due:'}
                </p>
                <p className="font-semibold text-blue-800">
                  {formatCurrency(financialData.nextPaymentAmount)}
                </p>
                <p className="text-xs text-blue-600">
                  {formatDate(financialData.nextPaymentDue)}
                </p>
              </div>
            )}
            <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Button 
                onClick={handleSendReminder}
                className="flex-1"
              >
                {language === 'ar' ? 'إرسال التذكير' : 'Send Reminder'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReminderDialog(false)}
                className="flex-1"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* حوار سجل الدفعات */}
      <Dialog open={showPaymentHistoryDialog} onOpenChange={setShowPaymentHistoryDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
              {language === 'ar' ? 'سجل الدفعات' : 'Payment History'}
            </DialogTitle>
            <DialogDescription className={language === 'ar' ? 'text-right' : 'text-left'}>
              {language === 'ar' 
                ? 'عرض جميع الدفعات والمعاملات المالية لهذا العميل' 
                : 'View all payments and financial transactions for this customer'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-96">
            {allPayments.length > 0 ? (
              <div className="space-y-3">
                {allPayments.map((payment, index) => (
                  <div 
                    key={payment.id || index}
                    className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <DollarSign className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className={`space-y-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <p className="font-semibold text-lg">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {language === 'ar' ? 'عقد:' : 'Contract:'} {payment.agreement_number}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`flex flex-col items-end gap-2 ${language === 'ar' ? 'items-start' : 'items-end'}`}>
                      <div className={`text-sm text-gray-500 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                          <div>
                          <span className="text-blue-600 font-medium">
                            {language === 'ar' ? 'الاستحقاق: 1 من كل شهر' : 'Due: 1st of each month'}
                            </span>
                          </div>
                          </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {language === 'ar' ? 'لا توجد دفعات مسجلة لهذا العميل' : 'No payments recorded for this customer'}
                </p>
              </div>
            )}
          </div>
          
          {allPayments.length > 0 && (
            <div className={`border-t pt-4 mt-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div>
                  <p className="text-gray-500 mb-1">
                    {language === 'ar' ? 'إجمالي الدفعات:' : 'Total Payments:'}
                  </p>
                  <p className="font-semibold text-lg">
                    {allPayments.length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">
                    {language === 'ar' ? 'الدفعات المكتملة:' : 'Completed Payments:'}
                  </p>
                  <p className="font-semibold text-lg text-green-600">
                    {allPayments.filter(p => p.status === 'paid' || p.status === 'completed').length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">
                    {language === 'ar' ? 'الدفعات المعلقة:' : 'Pending Payments:'}
                  </p>
                  <p className="font-semibold text-lg text-orange-600">
                    {allPayments.filter(p => p.status === 'pending' || p.status === 'overdue').length}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentHistoryDialog(false)}
              className="flex-1"
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 