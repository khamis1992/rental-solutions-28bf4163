// @ts-nocheck
/* eslint-disable */

import { formatCurrency, formatDate } from '@/lib/utils';
import { Payment } from '@/types/payment.types';
import { Edit, Trash } from 'lucide-react';

interface PaymentTableProps {
  payments: Payment[];
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentTable({ payments, onEditPayment, onDeletePayment }: PaymentTableProps) {
  // Function to get payment status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to translate payment status to Arabic
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'مدفوع';
      case 'pending':
        return 'معلق';
      case 'overdue':
        return 'متأخر';
      case 'partially_paid':
        return 'مدفوع جزئياً';
      case 'cancelled':
        return 'ملغي';
      case 'refunded':
        return 'مسترد';
      default:
        return 'غير محدد';
    }
  };

  // Function to translate payment method to Arabic
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

  // Function to translate payment type to Arabic
  const getPaymentTypeText = (type?: string) => {
    if (!type) return 'غير محدد';
    
    switch (type.toLowerCase()) {
      case 'rent':
        return 'إيجار';
      case 'deposit':
        return 'عربون';
      case 'late_fee':
        return 'رسوم تأخير';
      case 'maintenance':
        return 'صيانة';
      case 'fine':
        return 'غرامة';
      case 'refund':
        return 'استرداد';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  };

  return (
    <div className="relative overflow-x-auto rounded-md border" dir="rtl">
      <table className="w-full text-sm text-right">
        <thead className="text-xs uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-right">التاريخ</th>
            <th scope="col" className="px-4 py-3 text-right">النوع</th>
            <th scope="col" className="px-4 py-3 text-right">المبلغ</th>
            <th scope="col" className="px-4 py-3 text-right">رسوم التأخير</th>
            <th scope="col" className="px-4 py-3 text-right">الحالة</th>
            <th scope="col" className="px-4 py-3 text-right">طريقة الدفع</th>
            <th scope="col" className="px-4 py-3 text-right">الوصف</th>
            <th scope="col" className="px-4 py-3 text-right">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-right">{formatDate(payment.payment_date)}</td>
              <td className="px-4 py-3 text-right">{getPaymentTypeText(payment.type)}</td>
              <td className="px-4 py-3 font-medium text-right">{formatCurrency(payment.amount)} ر.ق</td>
              <td className="px-4 py-3 text-right">
                {payment.late_fine_amount && payment.late_fine_amount > 0 
                  ? `${formatCurrency(payment.late_fine_amount)} ر.ق`
                  : '-'}
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status || '')}`}>
                  {getStatusText(payment.status || '')}
                </span>
              </td>
              <td className="px-4 py-3 text-right">{getPaymentMethodText(payment.payment_method || undefined)}</td>
              <td className="px-4 py-3 max-w-xs truncate text-right">{payment.description || 'بدون وصف'}</td>
              <td className="px-4 py-3">
                <div className="flex space-x-2 space-x-reverse flex-row-reverse">
                  {onEditPayment && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEditPayment(payment)}
                      className="h-8 w-8"
                      title="تعديل الدفعة"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeletePayment && payment.id && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDeletePayment(payment.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      title="حذف الدفعة"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>لا توجد مدفوعات مسجلة</p>
          <p className="text-sm mt-2">أضف دفعة جديدة للبدء</p>
        </div>
      )}
    </div>
  );
}
