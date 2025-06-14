import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import { CarInstallmentPayment } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContractPaymentsTableProps {
  payments: CarInstallmentPayment[];
  onRecordPayment: (payment: CarInstallmentPayment) => void;
}

export const ContractPaymentsTable: React.FC<ContractPaymentsTableProps> = ({ 
  payments, 
  onRecordPayment 
}) => {
  const { language } = useLanguage();

  // Get status icon based on payment status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Get status text with appropriate color
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-green-500 font-medium">
          {language === 'ar' ? 'مدفوع' : 'Paid'}
        </span>;
      case 'pending':
        return <span className="text-amber-500 font-medium">
          {language === 'ar' ? 'معلق' : 'Pending'}
        </span>;
      case 'overdue':
        return <span className="text-red-500 font-medium">
          {language === 'ar' ? 'متأخر' : 'Overdue'}
        </span>;
      case 'cancelled':
        return <span className="text-gray-500 font-medium">
          {language === 'ar' ? 'ملغي' : 'Cancelled'}
        </span>;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {payments.length === 0 ? (
        <div className="p-8 text-center">
          <p className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'لم يتم العثور على مدفوعات' : 'No payments found'}
          </p>
          <p className={`text-sm text-muted-foreground mt-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'أضف دفعة للبدء' : 'Add a payment to get started'}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}
              </TableHead>
              <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'رقم الشيك' : 'Cheque #'}
              </TableHead>
              <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'البنك' : 'Bank'}
              </TableHead>
              <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}
              </TableHead>
              <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount'}
              </TableHead>
              <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'المتبقي' : 'Remaining'}
              </TableHead>
              <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'الحالة' : 'Status'}
              </TableHead>
              <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'الإجراءات' : 'Actions'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {formatDate(payment.payment_date)}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {payment.cheque_number}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {payment.drawee_bank}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {formatCurrency(payment.paid_amount || 0)}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {formatCurrency(payment.remaining_amount || 0)}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                  <div className={`flex items-center gap-1.5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    {getStatusIcon(payment.status)}
                    {getStatusText(payment.status)}
                    {payment.days_overdue && payment.days_overdue > 0 && (
                      <span className={`text-xs text-red-500 ${language === 'ar' ? 'mr-1' : 'ml-1'}`}>
                        ({payment.days_overdue} {language === 'ar' ? 'أيام' : 'days'})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onRecordPayment(payment)}
                      className={language === 'ar' ? 'flex-row-reverse' : ''}
                    >
                      <DollarSign className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                      {language === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
