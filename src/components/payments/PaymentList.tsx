import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Payment } from '@/types/payment.types';

interface PaymentListProps {
  payments: Payment[];
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentList({ payments, onDeletePayment }: PaymentListProps) {
  const getStatusBadge = (status: string | null | undefined) => {
    const style = status === 'completed' || status === 'paid'
      ? 'bg-green-100 text-green-800 hover:bg-green-200'
      : status === 'overdue'
      ? 'bg-red-100 text-red-800'
      : status === 'pending'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'partially_paid'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-gray-100 text-gray-800';

    const statusText = status === 'completed' || status === 'paid' ? 'مدفوع' 
      : status === 'overdue' ? 'متأخر' 
      : status === 'pending' ? 'معلق'
      : status === 'cancelled' ? 'ملغي'
      : status === 'partially_paid' ? 'مدفوع جزئياً'
      : 'غير محدد';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
        {statusText}
      </span>
    );
  };

  const getPaymentMethodText = (method?: string) => {
    if (!method) return 'غير محدد';
    
    switch (method.toLowerCase()) {
      case 'cash':
        return 'نقدي';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'credit_card':
        return 'بطاقة ائتمان';
      case 'debit_card':
        return 'بطاقة مدين';
      case 'cheque':
      case 'check':
        return 'شيك';
      case 'online_payment':
        return 'دفع إلكتروني';
      default:
        return method;
    }
  };

  return (
    <div dir="rtl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">التاريخ</TableHead>
            <TableHead className="text-right">المبلغ</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">طريقة الدفع</TableHead>
            <TableHead className="text-right">الوصف</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="text-right">
                {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : 'غير محدد'}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(payment.amount)} ر.ق</TableCell>
              <TableCell className="text-right">
                {getStatusBadge(payment.status || '')}
              </TableCell>
              <TableCell className="text-right">{getPaymentMethodText(payment.payment_method)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-right">
                {payment.description || 'إيجار شهري'}
              </TableCell>
              <TableCell className="text-right">
                {onDeletePayment && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDeletePayment(payment.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    حذف
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {payments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>لا توجد مدفوعات مسجلة</p>
          <p className="text-sm mt-2">أضف دفعة جديدة للبدء</p>
        </div>
      )}
    </div>
  );
}

export default PaymentList;
