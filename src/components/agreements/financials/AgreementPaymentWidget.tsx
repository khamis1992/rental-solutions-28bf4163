import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  Plus, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description?: string;
  type?: string;
}

interface AgreementPaymentWidgetProps {
  payments: Payment[];
  onAddPayment?: () => void;
  onViewAll?: () => void;
  className?: string;
}

export const AgreementPaymentWidget: React.FC<AgreementPaymentWidgetProps> = ({
  payments,
  onAddPayment,
  onViewAll,
  className
}) => {
  const { language } = useLanguage();
  const [showAllPayments, setShowAllPayments] = useState(false);

  // عرض آخر 3 دفعات فقط
  const recentPayments = payments
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .slice(0, showAllPayments ? payments.length : 3);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return language === 'ar' ? 'مدفوع' : 'Paid';
      case 'pending':
        return language === 'ar' ? 'معلق' : 'Pending';
      case 'overdue':
        return language === 'ar' ? 'متأخر' : 'Overdue';
      default:
        return status;
    }
  };

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
            <span>{language === 'ar' ? 'الدفعات الأخيرة' : 'Recent Payments'}</span>
            <Badge variant="secondary" className="text-xs">
              {payments.length}
            </Badge>
          </div>
          
          {onViewAll && payments.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onViewAll}
              className={cn(
                "flex items-center gap-1 text-blue-600",
                language === 'ar' ? 'flex-row-reverse' : ''
              )}
            >
              <span className="text-xs">
                {language === 'ar' ? 'عرض الكل' : 'View All'}
              </span>
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {payments.length === 0 ? (
          <div className={cn(
            "text-center py-8",
            language === 'ar' ? 'text-right' : ''
          )}>
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              {language === 'ar' ? 'لا توجد دفعات مسجلة' : 'No payments recorded'}
            </p>
            {onAddPayment && (
              <Button 
                onClick={onAddPayment}
                size="sm"
                className={cn(
                  "flex items-center gap-1 mx-auto",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}
              >
                <Plus className="h-4 w-4" />
                <span>{language === 'ar' ? 'إضافة دفعة' : 'Add Payment'}</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* قائمة الدفعات */}
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div 
                  key={payment.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border bg-gray-50/50",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}
                >
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
                        {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <Badge 
                    className={cn(
                      "text-xs border",
                      getStatusColor(payment.status)
                    )}
                  >
                    {getStatusLabel(payment.status)}
                  </Badge>
                </div>
              ))}
            </div>

            {/* إظهار المزيد من الدفعات */}
            {payments.length > 3 && !showAllPayments && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAllPayments(true)}
                className={cn(
                  "w-full text-blue-600",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}
              >
                {language === 'ar' 
                  ? `عرض ${payments.length - 3} دفعات أخرى` 
                  : `Show ${payments.length - 3} more payments`
                }
              </Button>
            )}

            {/* الإجراءات السريعة */}
            <div className={cn(
              "flex gap-2 pt-2 border-t",
              language === 'ar' ? 'flex-row-reverse' : ''
            )}>
              {onAddPayment && (
                <Button 
                  size="sm"
                  onClick={onAddPayment}
                  className={cn(
                    "flex items-center gap-1 flex-1",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span>{language === 'ar' ? 'دفعة جديدة' : 'New Payment'}</span>
                </Button>
              )}
              
              {onViewAll && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onViewAll}
                  className={cn(
                    "flex items-center gap-1 flex-1",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span>{language === 'ar' ? 'سجل كامل' : 'Full History'}</span>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 