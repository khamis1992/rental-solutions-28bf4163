import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Receipt, 
  AlertTriangle, 
  FileText,
  Send,
  Calculator
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FinancialQuickActionsProps {
  onRecordPayment?: () => void;
  onSendReminder?: () => void;
  onGenerateInvoice?: () => void;
  onFinancialReport?: () => void;
  onPaymentPlan?: () => void;
  hasOverduePayments?: boolean;
  className?: string;
}

export const FinancialQuickActions: React.FC<FinancialQuickActionsProps> = ({
  onRecordPayment,
  onSendReminder,
  onGenerateInvoice,
  onFinancialReport,
  onPaymentPlan,
  hasOverduePayments = false,
  className
}) => {
  const { language } = useLanguage();

  const actions = [
    {
      id: 'record-payment',
      label: language === 'ar' ? 'تسجيل دفعة' : 'Record Payment',
      icon: CreditCard,
      onClick: onRecordPayment,
      variant: 'default' as const,
      className: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'generate-invoice',
      label: language === 'ar' ? 'إنشاء فاتورة' : 'Generate Invoice',
      icon: Receipt,
      onClick: onGenerateInvoice,
      variant: 'outline' as const
    },
    {
      id: 'send-reminder',
      label: language === 'ar' ? 'إرسال تذكير' : 'Send Reminder',
      icon: Send,
      onClick: onSendReminder,
      variant: 'outline' as const,
      className: hasOverduePayments ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : undefined
    },
    {
      id: 'financial-report',
      label: language === 'ar' ? 'تقرير مالي' : 'Financial Report',
      icon: FileText,
      onClick: onFinancialReport,
      variant: 'outline' as const
    },
    {
      id: 'payment-plan',
      label: language === 'ar' ? 'خطة دفع' : 'Payment Plan',
      icon: Calculator,
      onClick: onPaymentPlan,
      variant: 'outline' as const
    }
  ];

  // إظهار تنبيه للدفعات المتأخرة
  if (hasOverduePayments) {
    actions.unshift({
      id: 'overdue-alert',
      label: language === 'ar' ? 'دفعات متأخرة!' : 'Overdue Payments!',
      icon: AlertTriangle,
      onClick: onSendReminder,
      variant: 'destructive' as const,
      className: 'bg-red-600 hover:bg-red-700 animate-pulse'
    });
  }

  return (
    <div className={cn("space-y-3", className)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {hasOverduePayments && (
        <div className={cn(
          "p-3 rounded-lg bg-red-50 border border-red-200",
          language === 'ar' ? 'text-right' : ''
        )}>
          <div className={cn(
            "flex items-center gap-2",
            language === 'ar' ? 'flex-row-reverse justify-end' : ''
          )}>
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              {language === 'ar' ? 'تنبيه: يوجد دفعات متأخرة' : 'Alert: Overdue payments detected'}
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            size="sm"
            onClick={action.onClick}
            className={cn(
              "flex items-center gap-2 h-auto py-3",
              language === 'ar' ? 'flex-row-reverse' : '',
              action.className
            )}
            disabled={!action.onClick}
          >
            <action.icon className="h-4 w-4" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}; 