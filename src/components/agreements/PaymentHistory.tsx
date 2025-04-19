import React, { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarIcon, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { useCallback } from 'react';

// Make sure to export the Payment type to fix the error 
// in AgreementDetail.tsx
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

export interface PaymentHistoryProps {
  payments: Payment[];
  rentAmount?: number | null;
  onPaymentDeleted: () => void;
  leaseStartDate?: string | Date | null;
  leaseEndDate?: string | Date | null;
}

export function PaymentHistory({
  payments = [],
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate
}: PaymentHistoryProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = useCallback(async (paymentId: string) => {
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
  }, [onPaymentDeleted]);

  const formatPaymentDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return dateString || 'N/A';
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
    const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
    return dateB - dateA;
  });

  const columns = [
    {
      accessorKey: 'payment_date',
      header: 'Date',
      cell: ({ row }) => formatPaymentDate(row.original.payment_date),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `QAR ${row.original.amount.toLocaleString()}`,
    },
    {
      accessorKey: 'payment_method',
      header: 'Method',
      cell: ({ row }) => row.original.payment_method || 'N/A',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.status === 'completed' ? 'bg-green-100 text-green-800' :
          row.original.status === 'overdue' ? 'bg-red-100 text-red-800' :
          row.original.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || 'N/A',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleDelete(row.original.id)}
          disabled={isDeleting === row.original.id}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <Card className="my-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all transactions for this agreement</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Monthly Rent: QAR {rentAmount?.toLocaleString() || '0'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <DataTable columns={columns} data={sortedPayments} />
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            No payment records found for this agreement.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
