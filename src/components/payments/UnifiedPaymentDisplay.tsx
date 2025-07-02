import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Payment } from '@/types/payment.types';
import { PaymentScheduleItem } from '@/services/PaymentScheduleService';

interface UnifiedPaymentDisplayProps {
  payments: Payment[];
  scheduleItems: PaymentScheduleItem[];
  onRecordPayment?: (scheduleItem: PaymentScheduleItem) => void;
  isLoading?: boolean;
  showProjected?: boolean;
}

interface UnifiedPaymentItem {
  id: string;
  dueDate: Date;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  type: 'actual' | 'scheduled';
  actualPayment?: Payment;
  scheduleItem?: PaymentScheduleItem;
}

export function UnifiedPaymentDisplay({
  payments = [],
  scheduleItems = [],
  onRecordPayment,
  isLoading = false,
  showProjected = true
}: UnifiedPaymentDisplayProps) {
  
  const unifiedItems = useMemo(() => {
    const items: UnifiedPaymentItem[] = [];
    
    // Process schedule items first
    scheduleItems.forEach(schedule => {
      // Find matching actual payment
      const matchingPayment = payments.find(payment => {
        const paymentDate = new Date(payment.payment_date || payment.created_at || '');
        const scheduleDate = new Date(schedule.due_date);
        
        // Match by month and year
        return paymentDate.getMonth() === scheduleDate.getMonth() &&
               paymentDate.getFullYear() === scheduleDate.getFullYear();
      });

      items.push({
        id: schedule.id || `schedule-${schedule.due_date}`,
        dueDate: new Date(schedule.due_date),
        amount: schedule.amount,
        description: schedule.description || 'دفعة مجدولة',
        status: matchingPayment ? 'completed' : 
                schedule.status === 'overdue' ? 'overdue' : 'pending',
        type: matchingPayment ? 'actual' : 'scheduled',
        actualPayment: matchingPayment,
        scheduleItem: schedule
      });
    });

    // Add unscheduled actual payments
    payments.forEach(payment => {
      const hasScheduleItem = scheduleItems.some(schedule => {
        const paymentDate = new Date(payment.payment_date || payment.created_at || '');
        const scheduleDate = new Date(schedule.due_date);
        
        return paymentDate.getMonth() === scheduleDate.getMonth() &&
               paymentDate.getFullYear() === scheduleDate.getFullYear();
      });

      if (!hasScheduleItem) {
        items.push({
          id: payment.id || `payment-${Date.now()}`,
          dueDate: new Date(payment.payment_date || payment.created_at || ''),
          amount: payment.amount || 0,
          description: payment.description || 'دفعة غير مجدولة',
          status: payment.status === 'paid' ? 'completed' : 
                  payment.status === 'pending' ? 'pending' : 'overdue',
          type: 'actual',
          actualPayment: payment
        });
      }
    });

    return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [payments, scheduleItems]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    const variant = status === 'completed' ? 'default' : 
                   status === 'overdue' ? 'destructive' : 'secondary';
    
    const label = type === 'scheduled' && status === 'pending' ? 'مجدولة' : 
                  status === 'completed' ? 'مكتملة' : 
                  status === 'overdue' ? 'متأخرة' : 'معلقة';
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin w-6 h-6 border-t-2 border-blue-500 rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
          <Calendar className="h-5 w-5" />
          الجدول الزمني للدفعات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unifiedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-right">لا توجد جدولة دفعات أو سجل متاح</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unifiedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      {getStatusIcon(item.status)}
                      {formatDate(item.dueDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 flex-row-reverse">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {formatCurrency(item.amount)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.description}</TableCell>
                  <TableCell className="text-right">
                    {getStatusBadge(item.status, item.type)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.type === 'scheduled' && item.status === 'pending' && onRecordPayment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRecordPayment(item.scheduleItem!)}
                      >
                        تسجيل الدفعة
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
