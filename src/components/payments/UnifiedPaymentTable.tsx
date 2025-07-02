
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Calendar, DollarSign } from 'lucide-react';

interface PaymentItem {
  id: string;
  dueDate: Date;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'overdue' | 'paid' | 'partially_paid' | 'cancelled';
  type: string;
  isProjected: boolean;
}

interface UnifiedPaymentTableProps {
  payments: PaymentItem[];
  onRecordPayment: (payment: PaymentItem) => void;
  isLoading: boolean;
  showProjectedPayments: boolean;
}

export function UnifiedPaymentTable({
  payments,
  onRecordPayment,
  isLoading,
  showProjectedPayments
}: UnifiedPaymentTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-t-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" dir="rtl">
        <p className="text-right">لم يتم العثور على سجلات دفع</p>
        {showProjectedPayments && (
          <p className="text-sm mt-2 text-right">لا يمكن إنشاء جدولة الدفعات</p>
        )}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-500 text-white">مدفوع</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">معلق</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 text-white">متأخر</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-500 text-white">مدفوع جزئياً</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500 text-white">ملغي</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  return (
    <div className="rounded-md border" dir="rtl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
            <TableHead className="text-right">الوصف</TableHead>
            <TableHead className="text-right">المبلغ</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">النوع</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className={payment.isProjected ? 'bg-blue-50' : ''}>
              <TableCell className="text-right">
                <div className="flex items-center flex-row-reverse">
                  <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
                  {formatDate(payment.dueDate)}
                </div>
              </TableCell>
              <TableCell className="text-right">{payment.description}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center flex-row-reverse">
                  <DollarSign className="h-4 w-4 ml-1 text-muted-foreground" />
                  {formatCurrency(payment.amount)}
                </div>
              </TableCell>
              <TableCell className="text-right">{getStatusBadge(payment.status)}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="capitalize">
                  {payment.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {payment.isProjected && payment.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRecordPayment(payment)}
                  >
                    تسجيل الدفعة
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
