
import React, { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null; 
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  description?: string;
  due_date?: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading?: boolean;
  rentAmount?: number | null;
  onPaymentDeleted: () => void;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
  onRecordPayment?: (payment: Partial<Payment>) => void;
}

export function PaymentHistory({
  payments = [],
  isLoading = false,
  rentAmount,
  onPaymentDeleted,
  onRecordPayment
}: PaymentHistoryProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (paymentId: string) => {
    try {
      setIsDeleting(paymentId);
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        toast.error(`Failed to delete payment: ${error.message}`);
        return;
      }

      toast.success('Payment deleted successfully');
      onPaymentDeleted();
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className={cn(baseClasses, "bg-green-100 text-green-800")}>completed</span>;
      case 'overdue':
        return <span className={cn(baseClasses, "bg-red-100 text-red-800")}>overdue</span>;
      case 'unpaid':
        return <span className={cn(baseClasses, "bg-red-100 text-red-800")}>Unpaid</span>;
      default:
        return <span className={cn(baseClasses, "bg-gray-100 text-gray-800")}>{status || 'N/A'}</span>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
    const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all transactions for this agreement</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onRecordPayment?.({})}
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>QAR {payment.amount?.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{payment.payment_method || '-'}</TableCell>
                  <TableCell>{payment.description || 'Pending Monthly Payment'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(payment.id)}
                      disabled={isDeleting === payment.id}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && sortedPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No payment records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
