import React, { useMemo } from 'react';
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
  Receipt
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description?: string;
}

interface AgreementFinancialData {
  id: string;
  total_amount: number;
  deposit_amount?: number;
  monthly_amount?: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface AgreementFinancialSummaryProps {
  agreement: AgreementFinancialData;
  payments: Payment[];
  className?: string;
  onPaymentAction?: (action: 'add' | 'reminder' | 'report') => void;
}

export const AgreementFinancialSummary: React.FC<AgreementFinancialSummaryProps> = ({
  agreement,
  payments,
  className,
  onPaymentAction
}) => {
  const { language } = useLanguage();

  const financialStats = useMemo(() => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    
    const totalRemaining = (agreement.total_amount || 0) - totalPaid;
    const paymentProgress = agreement.total_amount > 0 
      ? Math.round((totalPaid / agreement.total_amount) * 100)
      : 0;

    // Calculate next payment due
    const nextPayment = payments
      .filter(p => p.status === 'pending')
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
      totalPayments: payments.length
    };
  }, [agreement, payments]);

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
            <DollarSign className="h-5 w-5 text-blue-500" />
            <span>{language === 'ar' ? 'الملخص المالي' : 'Financial Summary'}</span>
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
                {language === 'ar' ? 'مدفوع' : 'Paid'}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(financialStats.totalPaid)}
            </p>
            <p className="text-xs text-gray-500">
              {financialStats.paidCount} {language === 'ar' ? 'دفعة' : 'payments'}
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
              {formatCurrency(financialStats.totalPending)}
            </p>
            <p className="text-xs text-gray-500">
              {financialStats.pendingCount} {language === 'ar' ? 'دفعة' : 'payments'}
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
              {formatCurrency(financialStats.totalOverdue)}
            </p>
            <p className="text-xs text-gray-500">
              {financialStats.overdueCount} {language === 'ar' ? 'دفعة' : 'payments'}
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
                {language === 'ar' ? 'متبقي' : 'Remaining'}
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(financialStats.totalRemaining)}
            </p>
            <p className="text-xs text-gray-500">
              {agreement.total_amount > 0 ? Math.round((financialStats.totalRemaining / agreement.total_amount) * 100) : 0}% {language === 'ar' ? 'من المجموع' : 'of total'}
            </p>
          </div>
        </div>

        {/* شريط التقدم */}
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
          <Progress value={financialStats.paymentProgress} className="h-3" />
          <div className={cn(
            "flex justify-between text-xs text-muted-foreground",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            <span>{formatCurrency(agreement.total_amount || 0)}</span>
            <span>
              {formatCurrency(financialStats.totalPaid)} {language === 'ar' ? 'مدفوع' : 'paid'}
            </span>
          </div>
        </div>

        {/* الدفعة التالية */}
        {financialStats.nextPayment && (
          <div className={cn(
            "p-4 rounded-lg bg-blue-50 border border-blue-200",
            language === 'ar' ? 'text-right' : ''
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-2",
              language === 'ar' ? 'flex-row-reverse justify-end' : ''
            )}>
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-700">
                {language === 'ar' ? 'الدفعة التالية' : 'Next Payment'}
              </span>
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
              {financialStats.overdueCount > 0 && (
                <Badge className="bg-red-100 text-red-700">
                  {language === 'ar' ? 'متأخر' : 'Overdue'}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* الإجراءات السريعة */}
        <div className={cn(
          "flex gap-2",
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
          
          {financialStats.overdueCount > 0 && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onPaymentAction?.('reminder')}
              className={cn(
                "flex items-center gap-1 text-orange-600 border-orange-200",
                language === 'ar' ? 'flex-row-reverse' : ''
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{language === 'ar' ? 'إرسال تذكير' : 'Send Reminder'}</span>
            </Button>
          )}
          
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