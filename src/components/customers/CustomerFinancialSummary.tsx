import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  CreditCard,
  Receipt,
  User,
  FileText,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CustomerPayment {
  id: string;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description?: string;
  lease_id?: string;
  agreement_number?: string;
}

interface CustomerAgreement {
  id: string;
  agreement_number: string;
  total_amount: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface CustomerFinancialData {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalOutstanding: number;
  paymentHistory: CustomerPayment[];
  activeAgreements: CustomerAgreement[];
  completedPayments: number;
  totalPayments: number;
  averagePaymentAmount: number;
  lastPaymentDate?: string;
  nextPaymentDue?: CustomerPayment;
}

interface CustomerFinancialSummaryProps {
  customerId: string;
  className?: string;
  onPaymentAction?: (action: 'add' | 'reminder' | 'history' | 'report') => void;
}

export const CustomerFinancialSummary: React.FC<CustomerFinancialSummaryProps> = ({
  customerId,
  className,
  onPaymentAction
}) => {
  const { language } = useLanguage();
  const [financialData, setFinancialData] = useState<CustomerFinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب البيانات المالية للعميل
  useEffect(() => {
    const fetchCustomerFinancialData = async () => {
      if (!customerId) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // جلب العقود النشطة للعميل
        const { data: agreements, error: agreementsError } = await supabase
          .from('leases')
          .select('id, agreement_number, total_amount, status, start_date, end_date')
          .eq('customer_id', customerId);

        if (agreementsError) throw agreementsError;

        // جلب جميع الدفعات للعميل
        const { data: payments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select(`
            id, 
            amount, 
            payment_date, 
            status, 
            description, 
            lease_id,
            leases!inner(agreement_number)
          `)
          .eq('customer_id', customerId)
          .order('payment_date', { ascending: false });

        if (paymentsError) throw paymentsError;

        // معالجة البيانات
        const processedPayments: CustomerPayment[] = (payments || []).map(p => ({
          id: p.id,
          amount: p.amount || 0,
          payment_date: p.payment_date,
          status: p.status as any,
          description: p.description,
          lease_id: p.lease_id,
          agreement_number: (p.leases as any)?.agreement_number
        }));

        // حساب الإحصائيات
        const paidPayments = processedPayments.filter(p => p.status === 'paid');
        const pendingPayments = processedPayments.filter(p => p.status === 'pending');
        const overduePayments = processedPayments.filter(p => p.status === 'overdue');

        const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
        const totalOutstanding = totalPending + totalOverdue;

        const averagePaymentAmount = paidPayments.length > 0 
          ? totalPaid / paidPayments.length 
          : 0;

        const lastPaymentDate = paidPayments.length > 0 
          ? paidPayments[0].payment_date 
          : undefined;

        const nextPaymentDue = [...pendingPayments, ...overduePayments]
          .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())[0];

        const activeAgreements = (agreements || []).filter(a => a.status === 'active');

        setFinancialData({
          totalPaid,
          totalPending,
          totalOverdue,
          totalOutstanding,
          paymentHistory: processedPayments,
          activeAgreements,
          completedPayments: paidPayments.length,
          totalPayments: processedPayments.length,
          averagePaymentAmount,
          lastPaymentDate,
          nextPaymentDue
        });

      } catch (error: any) {
        console.error('خطأ في جلب البيانات المالية للعميل:', error);
        setError(error.message);
        toast.error('فشل في تحميل البيانات المالية للعميل');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerFinancialData();
  }, [customerId]);

  // حساب نسبة الدفع في الوقت المحدد
  const onTimePaymentRate = useMemo(() => {
    if (!financialData || financialData.totalPayments === 0) return 0;
    return Math.round((financialData.completedPayments / financialData.totalPayments) * 100);
  }, [financialData]);

  // تحديد حالة الصحة المالية للعميل
  const getFinancialHealthStatus = () => {
    if (!financialData) return { status: 'unknown', label: '', color: '' };

    if (financialData.totalOverdue > 0) {
      return { 
        status: 'critical', 
        label: language === 'ar' ? 'حرجة' : 'Critical',
        color: 'text-red-600 bg-red-50 border-red-200'
      };
    }
    if (financialData.totalPending > financialData.totalPaid * 0.3) {
      return { 
        status: 'warning', 
        label: language === 'ar' ? 'تحتاج انتباه' : 'Needs Attention',
        color: 'text-orange-600 bg-orange-50 border-orange-200'
      };
    }
    if (onTimePaymentRate >= 80) {
      return { 
        status: 'excellent', 
        label: language === 'ar' ? 'ممتاز' : 'Excellent',
        color: 'text-green-600 bg-green-50 border-green-200'
      };
    }
    return { 
      status: 'good', 
      label: language === 'ar' ? 'جيد' : 'Good',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    };
  };

  const healthStatus = getFinancialHealthStatus();

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !financialData) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className={cn(
            "text-center py-8",
            language === 'ar' ? 'text-right' : ''
          )}>
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {language === 'ar' ? 'فشل في تحميل البيانات المالية' : 'Failed to load financial data'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center justify-between",
          language === 'ar' ? 'flex-row-reverse text-right' : ''
        )}>
          <div className={cn(
            "flex items-center gap-2",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            <User className="h-5 w-5 text-blue-500" />
            <span>{language === 'ar' ? 'الملخص المالي للعميل' : 'Customer Financial Summary'}</span>
          </div>
          
          <Badge className={cn("text-xs", healthStatus.color)}>
            {healthStatus.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={cn(
            "p-4 rounded-lg border",
            language === 'ar' ? 'text-right' : ''
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-2",
              language === 'ar' ? 'flex-row-reverse justify-end' : ''
            )}>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">
                {language === 'ar' ? 'إجمالي المدفوعات' : 'Total Paid'}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(financialData.totalPaid)}
            </p>
            <p className="text-xs text-gray-500">
              {financialData.completedPayments} {language === 'ar' ? 'دفعة' : 'payments'}
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-lg border",
            language === 'ar' ? 'text-right' : ''
          )}>
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
              {formatCurrency(financialData.totalPending)}
            </p>
            <p className="text-xs text-gray-500">
              {language === 'ar' ? 'دفعات منتظرة' : 'pending payments'}
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-lg border",
            language === 'ar' ? 'text-right' : ''
          )}>
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
              {formatCurrency(financialData.totalOverdue)}
            </p>
            <p className="text-xs text-gray-500">
              {language === 'ar' ? 'يتطلب متابعة' : 'requires follow-up'}
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-lg border",
            language === 'ar' ? 'text-right' : ''
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-2",
              language === 'ar' ? 'flex-row-reverse justify-end' : ''
            )}>
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">
                {language === 'ar' ? 'متوسط الدفعة' : 'Avg Payment'}
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(financialData.averagePaymentAmount)}
            </p>
            <p className="text-xs text-gray-500">
              {language === 'ar' ? 'لكل دفعة' : 'per payment'}
            </p>
          </div>
        </div>

        {/* مؤشر الأداء */}
        <div className="space-y-3">
          <div className={cn(
            "flex justify-between text-sm",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            <span className="font-medium">
              {language === 'ar' ? 'معدل الدفع في الوقت المحدد' : 'On-time Payment Rate'}
            </span>
            <span className="text-muted-foreground">
              {onTimePaymentRate}%
            </span>
          </div>
          <Progress value={onTimePaymentRate} className="h-3" />
          <div className={cn(
            "flex justify-between text-xs text-muted-foreground",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            <span>
              {financialData.completedPayments} {language === 'ar' ? 'من' : 'of'} {financialData.totalPayments}
            </span>
            <span>
              {language === 'ar' ? 'دفعات مكتملة' : 'completed payments'}
            </span>
          </div>
        </div>

        {/* الدفعة التالية المستحقة */}
        {financialData.nextPaymentDue && (
          <div className={cn(
            "p-4 rounded-lg border-l-4",
            financialData.nextPaymentDue.status === 'overdue' 
              ? "border-l-red-500 bg-red-50" 
              : "border-l-blue-500 bg-blue-50",
            language === 'ar' ? 'text-right border-r-4 border-l-0' : ''
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-2",
              language === 'ar' ? 'flex-row-reverse justify-end' : ''
            )}>
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-700">
                {language === 'ar' ? 'الدفعة التالية المستحقة' : 'Next Payment Due'}
              </span>
              {financialData.nextPaymentDue.status === 'overdue' && (
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
                  {formatCurrency(financialData.nextPaymentDue.amount)}
                </p>
                <p className="text-sm text-blue-600">
                  {new Date(financialData.nextPaymentDue.payment_date).toLocaleDateString(
                    language === 'ar' ? 'ar-SA' : 'en-US'
                  )}
                </p>
                {financialData.nextPaymentDue.agreement_number && (
                  <p className="text-xs text-gray-500">
                    {language === 'ar' ? 'عقد رقم:' : 'Agreement:'} {financialData.nextPaymentDue.agreement_number}
                  </p>
                )}
              </div>
              <Button 
                size="sm" 
                variant={financialData.nextPaymentDue.status === 'overdue' ? "destructive" : "default"}
                onClick={() => onPaymentAction?.('reminder')}
              >
                {language === 'ar' ? 'إرسال تذكير' : 'Send Reminder'}
              </Button>
            </div>
          </div>
        )}

        {/* العقود النشطة */}
        {financialData.activeAgreements.length > 0 && (
          <div className="space-y-2">
            <h4 className={cn(
              "font-medium text-sm text-gray-700",
              language === 'ar' ? 'text-right' : ''
            )}>
              {language === 'ar' ? 'العقود النشطة' : 'Active Agreements'} ({financialData.activeAgreements.length})
            </h4>
            <div className="grid gap-2">
              {financialData.activeAgreements.slice(0, 3).map((agreement) => (
                <div 
                  key={agreement.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border bg-gray-50",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div className={language === 'ar' ? 'text-right' : ''}>
                    <p className="font-medium text-sm">{agreement.agreement_number}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(agreement.total_amount)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {agreement.status}
                  </Badge>
                </div>
              ))}
              {financialData.activeAgreements.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onPaymentAction?.('history')}
                  className={cn(
                    "text-blue-600",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}
                >
                  <ArrowUpRight className="h-3 w-3" />
                  <span>
                    {language === 'ar' 
                      ? `عرض ${financialData.activeAgreements.length - 3} عقود أخرى` 
                      : `View ${financialData.activeAgreements.length - 3} more agreements`
                    }
                  </span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* الإجراءات السريعة */}
        <div className={cn(
          "flex gap-2 pt-4 border-t",
          language === 'ar' ? 'flex-row-reverse' : ''
        )}>
          <Button 
            size="sm" 
            onClick={() => onPaymentAction?.('add')}
            className={cn(
              "flex items-center gap-1",
              language === 'ar' ? 'flex-row-reverse' : ''
            )}
          >
            <CreditCard className="h-4 w-4" />
            <span>{language === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onPaymentAction?.('history')}
            className={cn(
              "flex items-center gap-1",
              language === 'ar' ? 'flex-row-reverse' : ''
            )}
          >
            <FileText className="h-4 w-4" />
            <span>{language === 'ar' ? 'سجل الدفعات' : 'Payment History'}</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onPaymentAction?.('report')}
            className={cn(
              "flex items-center gap-1",
              language === 'ar' ? 'flex-row-reverse' : ''
            )}
          >
            <Receipt className="h-4 w-4" />
            <span>{language === 'ar' ? 'تقرير مالي' : 'Financial Report'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 