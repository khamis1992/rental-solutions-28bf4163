import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  CreditCard,
  Receipt,
  Send,
  FileText,
  Calculator,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Types
interface DemoPayment {
  id: string;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description?: string;
  type?: string;
}

interface DemoAgreement {
  id: string;
  agreement_number: string;
  total_amount: number;
  deposit_amount?: number;
  monthly_amount?: number;
  start_date: string;
  end_date: string;
  status: string;
  customer_name: string;
  vehicle_info: string;
}

// Sample data
const sampleAgreement: DemoAgreement = {
  id: '1',
  agreement_number: 'AG-2024-001',
  total_amount: 50000,
  deposit_amount: 5000,
  monthly_amount: 2500,
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  status: 'active',
  customer_name: 'أحمد محمد',
  vehicle_info: 'تويوتا كامري 2023'
};

const samplePayments: DemoPayment[] = [
  {
    id: '1',
    amount: 5000,
    payment_date: '2024-01-01',
    status: 'paid',
    description: 'دفعة الضمان',
    type: 'deposit'
  },
  {
    id: '2',
    amount: 2500,
    payment_date: '2024-01-15',
    status: 'paid',
    description: 'الإيجار الشهري - يناير',
    type: 'monthly_rent'
  },
  {
    id: '3',
    amount: 2500,
    payment_date: '2024-02-15',
    status: 'paid',
    description: 'الإيجار الشهري - فبراير',
    type: 'monthly_rent'
  },
  {
    id: '4',
    amount: 2500,
    payment_date: '2024-03-15',
    status: 'overdue',
    description: 'الإيجار الشهري - مارس',
    type: 'monthly_rent'
  },
  {
    id: '5',
    amount: 2500,
    payment_date: '2024-04-15',
    status: 'pending',
    description: 'الإيجار الشهري - أبريل',
    type: 'monthly_rent'
  }
];

export const FinancialIntegrationDemo: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('summary');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Calculate financial statistics
  const financialStats = useMemo(() => {
    const paidPayments = samplePayments.filter(p => p.status === 'paid');
    const pendingPayments = samplePayments.filter(p => p.status === 'pending');
    const overduePayments = samplePayments.filter(p => p.status === 'overdue');
    
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    
    const totalRemaining = sampleAgreement.total_amount - totalPaid;
    const paymentProgress = Math.round((totalPaid / sampleAgreement.total_amount) * 100);

    const nextPayment = samplePayments
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())[0];

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      totalRemaining,
      paymentProgress,
      nextPayment,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
      overdueCount: overduePayments.length,
      totalPayments: samplePayments.length
    };
  }, []);

  const getFinancialHealthStatus = () => {
    if (financialStats.overdueCount > 0) {
      return { 
        status: 'critical', 
        label: language === 'ar' ? 'حرجة' : 'Critical',
        color: 'text-red-600 bg-red-50 border-red-200'
      };
    }
    if (financialStats.totalOverdue > 0) {
      return { 
        status: 'warning', 
        label: language === 'ar' ? 'تحتاج انتباه' : 'Needs Attention',
        color: 'text-orange-600 bg-orange-50 border-orange-200'
      };
    }
    return { 
      status: 'good', 
      label: language === 'ar' ? 'جيدة' : 'Good',
      color: 'text-green-600 bg-green-50 border-green-200'
    };
  };

  const healthStatus = getFinancialHealthStatus();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className={cn(
        "flex items-center justify-between",
        language === 'ar' ? 'flex-row-reverse' : ''
      )}>
        <div className={language === 'ar' ? 'text-right' : ''}>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'نموذج التكامل المالي المتقدم' : 'Advanced Financial Integration Demo'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? `عقد رقم ${sampleAgreement.agreement_number} - ${sampleAgreement.customer_name}`
              : `Agreement ${sampleAgreement.agreement_number} - ${sampleAgreement.customer_name}`
            }
          </p>
        </div>
        
        <Badge className={healthStatus.color}>
          {healthStatus.label}
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">{language === 'ar' ? 'الملخص المالي' : 'Financial Summary'}</TabsTrigger>
          <TabsTrigger value="payments">{language === 'ar' ? 'الدفعات' : 'Payments'}</TabsTrigger>
          <TabsTrigger value="actions">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TabsTrigger>
          <TabsTrigger value="reports">{language === 'ar' ? 'التقارير' : 'Reports'}</TabsTrigger>
        </TabsList>

        {/* Financial Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  language === 'ar' ? 'flex-row-reverse justify-end' : ''
                )}>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    {language === 'ar' ? 'مدفوع' : 'Paid'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialStats.totalPaid)}
                </p>
                <p className="text-xs text-gray-500">
                  {financialStats.paidCount} {language === 'ar' ? 'دفعة' : 'payments'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  language === 'ar' ? 'flex-row-reverse justify-end' : ''
                )}>
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">
                    {language === 'ar' ? 'معلق' : 'Pending'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financialStats.totalPending)}
                </p>
                <p className="text-xs text-gray-500">
                  {financialStats.pendingCount} {language === 'ar' ? 'دفعة' : 'payments'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  language === 'ar' ? 'flex-row-reverse justify-end' : ''
                )}>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    {language === 'ar' ? 'متأخر' : 'Overdue'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialStats.totalOverdue)}
                </p>
                <p className="text-xs text-gray-500">
                  {financialStats.overdueCount} {language === 'ar' ? 'دفعة' : 'payments'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  language === 'ar' ? 'flex-row-reverse justify-end' : ''
                )}>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">
                    {language === 'ar' ? 'متبقي' : 'Remaining'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(financialStats.totalRemaining)}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.round((financialStats.totalRemaining / sampleAgreement.total_amount) * 100)}% {language === 'ar' ? 'من المجموع' : 'of total'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className={cn(
                  "flex justify-between text-sm",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}>
                  <span className="font-medium">
                    {language === 'ar' ? 'تقدم الدفعات' : 'Payment Progress'}
                  </span>
                  <span className="text-muted-foreground">
                    {financialStats.paymentProgress}%
                  </span>
                </div>
                <Progress value={financialStats.paymentProgress} className="h-4" />
                <div className={cn(
                  "flex justify-between text-xs text-muted-foreground",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}>
                  <span>{formatCurrency(sampleAgreement.total_amount)}</span>
                  <span>
                    {formatCurrency(financialStats.totalPaid)} {language === 'ar' ? 'مدفوع' : 'paid'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Payment Alert */}
          {financialStats.nextPayment && (
            <Card className="border-l-4 border-l-blue-500 bg-blue-50">
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  language === 'ar' ? 'flex-row-reverse justify-end' : ''
                )}>
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-700">
                    {language === 'ar' ? 'الدفعة التالية' : 'Next Payment'}
                  </span>
                  {financialStats.nextPayment.status === 'overdue' && (
                    <Badge className="bg-red-100 text-red-700 animate-pulse">
                      {language === 'ar' ? 'متأخر!' : 'Overdue!'}
                    </Badge>
                  )}
                </div>
                <div className={cn(
                  "flex items-center justify-between",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}>
                  <div>
                    <p className="font-bold text-blue-800">
                      {formatCurrency(financialStats.nextPayment.amount)}
                    </p>
                    <p className="text-sm text-blue-600">
                      {new Date(financialStats.nextPayment.payment_date).toLocaleDateString(
                        language === 'ar' ? 'ar-SA' : 'en-US'
                      )}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setShowPaymentDialog(true)}>
                    {language === 'ar' ? 'دفع الآن' : 'Pay Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className={cn(
            "flex justify-between items-center",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'سجل الدفعات' : 'Payment History'}
            </h3>
            <Button onClick={() => setShowPaymentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إضافة دفعة' : 'Add Payment'}
            </Button>
          </div>

          <div className="space-y-3">
            {samplePayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className={cn(
                    "flex items-center justify-between",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <div className={cn(
                      "flex items-center gap-3",
                      language === 'ar' ? 'flex-row-reverse' : ''
                    )}>
                      {getStatusIcon(payment.status)}
                      <div className={language === 'ar' ? 'text-right' : ''}>
                        <p className="font-medium">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(payment.payment_date).toLocaleDateString(
                            language === 'ar' ? 'ar-SA' : 'en-US'
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status === 'paid' && (language === 'ar' ? 'مدفوع' : 'Paid')}
                      {payment.status === 'pending' && (language === 'ar' ? 'معلق' : 'Pending')}
                      {payment.status === 'overdue' && (language === 'ar' ? 'متأخر' : 'Overdue')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          {financialStats.overdueCount > 0 && (
            <Card className="border-l-4 border-l-red-500 bg-red-50">
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center gap-2",
                  language === 'ar' ? 'flex-row-reverse justify-end' : ''
                )}>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    {language === 'ar' ? 'تنبيه: يوجد دفعات متأخرة' : 'Alert: Overdue payments detected'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="default"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => setShowPaymentDialog(true)}
            >
              <CreditCard className="h-6 w-6" />
              <span>{language === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Receipt className="h-6 w-6" />
              <span>{language === 'ar' ? 'إنشاء فاتورة' : 'Generate Invoice'}</span>
            </Button>

            <Button
              variant="outline"
              className={cn(
                "h-auto py-4 flex flex-col items-center gap-2",
                financialStats.overdueCount > 0 && "border-orange-200 text-orange-600"
              )}
            >
              <Send className="h-6 w-6" />
              <span>{language === 'ar' ? 'إرسال تذكير' : 'Send Reminder'}</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <FileText className="h-6 w-6" />
              <span>{language === 'ar' ? 'تقرير مالي' : 'Financial Report'}</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Calculator className="h-6 w-6" />
              <span>{language === 'ar' ? 'خطة دفع' : 'Payment Plan'}</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <ArrowUpRight className="h-6 w-6" />
              <span>{language === 'ar' ? 'عرض التفاصيل' : 'View Details'}</span>
            </Button>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'ملخص الأداء المالي' : 'Financial Performance Summary'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={cn(
                    "flex justify-between",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <span>{language === 'ar' ? 'نسبة الدفع في الوقت المحدد:' : 'On-time Payment Rate:'}</span>
                    <span className="font-bold text-green-600">60%</span>
                  </div>
                  <div className={cn(
                    "flex justify-between",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <span>{language === 'ar' ? 'متوسط مدة التأخير:' : 'Average Delay:'}</span>
                    <span className="font-bold text-orange-600">
                      {language === 'ar' ? '5 أيام' : '5 days'}
                    </span>
                  </div>
                  <div className={cn(
                    "flex justify-between",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <span>{language === 'ar' ? 'إجمالي المبلغ المحصل:' : 'Total Collected:'}</span>
                    <span className="font-bold text-blue-600">{formatCurrency(financialStats.totalPaid)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'التوقعات المالية' : 'Financial Projections'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={cn(
                    "flex justify-between",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <span>{language === 'ar' ? 'المتوقع الشهر القادم:' : 'Expected Next Month:'}</span>
                    <span className="font-bold text-green-600">{formatCurrency(2500)}</span>
                  </div>
                  <div className={cn(
                    "flex justify-between",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <span>{language === 'ar' ? 'المبلغ المتبقي للعقد:' : 'Remaining Contract Amount:'}</span>
                    <span className="font-bold text-purple-600">{formatCurrency(financialStats.totalRemaining)}</span>
                  </div>
                  <div className={cn(
                    "flex justify-between",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <span>{language === 'ar' ? 'تاريخ الإنجاز المتوقع:' : 'Expected Completion:'}</span>
                    <span className="font-bold text-blue-600">
                      {language === 'ar' ? 'ديسمبر 2024' : 'December 2024'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog Simulation */}
      {showPaymentDialog && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl border-2 border-blue-200">
          <CardHeader>
            <CardTitle className={cn(
              "flex items-center justify-between",
              language === 'ar' ? 'flex-row-reverse text-right' : ''
            )}>
              <span>{language === 'ar' ? 'تسجيل دفعة جديدة' : 'Record New Payment'}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPaymentDialog(false)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              "text-center py-8",
              language === 'ar' ? 'text-right' : ''
            )}>
              <CreditCard className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ar' ? 'نموذج تسجيل الدفعة' : 'Payment Recording Demo'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'ar' 
                  ? 'هذا نموذج توضيحي لتسجيل الدفعات مع التكامل المالي المتقدم'
                  : 'This is a demo of payment recording with advanced financial integration'
                }
              </p>
              <Button onClick={() => setShowPaymentDialog(false)}>
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 