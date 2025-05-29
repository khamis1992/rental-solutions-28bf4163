
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Payment } from '@/types/payment.types';
import { PaymentScheduleItem } from '@/services/PaymentScheduleService';

interface UnifiedPaymentItem {
  id: string;
  type: 'schedule' | 'payment';
  dueDate: Date;
  amount: number;
  status: string;
  paymentDate?: Date;
  description?: string;
  scheduleId?: string;
  paymentId?: string;
}

interface UnifiedPaymentDisplayProps {
  payments: Payment[];
  scheduleItems: PaymentScheduleItem[];
  onRecordPayment?: (scheduleItem: PaymentScheduleItem) => void;
  isLoading?: boolean;
}

export function UnifiedPaymentDisplay({
  payments,
  scheduleItems,
  onRecordPayment,
  isLoading = false
}: UnifiedPaymentDisplayProps) {
  // Merge and sort payments and schedule items
  const unifiedItems: UnifiedPaymentItem[] = React.useMemo(() => {
    const items: UnifiedPaymentItem[] = [];

    // Add schedule items
    scheduleItems.forEach(schedule => {
      // Check if there's a corresponding payment
      const matchingPayment = payments.find(payment => {
        const paymentMonth = new Date(payment.payment_date || payment.created_at || '').getMonth();
        const scheduleMonth = new Date(schedule.due_date).getMonth();
        const paymentYear = new Date(payment.payment_date || payment.created_at || '').getFullYear();
        const scheduleYear = new Date(schedule.due_date).getFullYear();
        
        return paymentMonth === scheduleMonth && paymentYear === scheduleYear;
      });

      items.push({
        id: `schedule-${schedule.id}`,
        type: 'schedule',
        dueDate: new Date(schedule.due_date),
        amount: schedule.amount,
        status: matchingPayment ? 'completed' : schedule.status,
        paymentDate: matchingPayment?.payment_date ? new Date(matchingPayment.payment_date) : undefined,
        description: schedule.description,
        scheduleId: schedule.id,
        paymentId: matchingPayment?.id
      });
    });

    // Add payments that don't have corresponding schedule items
    payments.forEach(payment => {
      const hasScheduleItem = scheduleItems.some(schedule => {
        const paymentMonth = new Date(payment.payment_date || payment.created_at || '').getMonth();
        const scheduleMonth = new Date(schedule.due_date).getMonth();
        const paymentYear = new Date(payment.payment_date || payment.created_at || '').getFullYear();
        const scheduleYear = new Date(schedule.due_date).getFullYear();
        
        return paymentMonth === scheduleMonth && paymentYear === scheduleYear;
      });

      if (!hasScheduleItem) {
        items.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          dueDate: new Date(payment.payment_date || payment.created_at || ''),
          amount: payment.amount || 0,
          status: payment.status || 'completed',
          paymentDate: payment.payment_date ? new Date(payment.payment_date) : undefined,
          description: payment.description || 'Unscheduled payment',
          paymentId: payment.id
        });
      }
    });

    return items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [payments, scheduleItems]);

  const getStatusBadge = (status: string, type: 'schedule' | 'payment') => {
    const baseClasses = "flex items-center gap-1";
    
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className={`${baseClasses} border-green-200 text-green-700 bg-green-50`}>
            <CheckCircle className="h-3 w-3" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className={`${baseClasses} border-yellow-200 text-yellow-700 bg-yellow-50`}>
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className={`${baseClasses} border-red-200 text-red-700 bg-red-50`}>
            <AlertCircle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className={baseClasses}>
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule & History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-t-2 border-blue-500 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Schedule & History
          <span className="text-sm text-muted-foreground font-normal">
            ({unifiedItems.length} items)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unifiedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No payment schedule or history available</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unifiedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {formatDate(item.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status, item.type)}
                    </TableCell>
                    <TableCell>
                      {item.paymentDate ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {formatDate(item.paymentDate)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.description || 'Payment'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.type === 'schedule' && item.status === 'pending' && onRecordPayment && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const scheduleItem = scheduleItems.find(s => s.id === item.scheduleId);
                            if (scheduleItem) {
                              onRecordPayment(scheduleItem);
                            }
                          }}
                        >
                          Record Payment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
