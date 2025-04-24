
import React, { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { useCallback } from 'react';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { asPaymentId } from '@/utils/database-type-helpers';

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
  leaseStartDate,
  leaseEndDate,
  onRecordPayment
}: PaymentHistoryProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

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
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return 'N/A';
    }
  };

  // Add the missing handlePaymentSubmit function
  const handlePaymentSubmit = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string,
    includeLatePaymentFee?: boolean
  ) => {
    if (!onRecordPayment) return;
    
    const payment: Partial<Payment> = {
      amount,
      payment_date: paymentDate.toISOString(),
      notes,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      status: 'completed',
      description: notes || 'Payment'
    };
    
    onRecordPayment(payment);
    setIsPaymentDialogOpen(false);
  }, [onRecordPayment]);

  const columns = [
    {
      accessorKey: 'payment_date',
      header: 'Date',
      cell: ({ row }: { row: any }) => formatPaymentDate(row.original.payment_date),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          QAR {row.original.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => {
        const status = row.original.status?.toLowerCase();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'completed' ? 'bg-green-100 text-green-800' :
            status === 'overdue' ? 'bg-red-100 text-red-800' :
            status === 'unpaid' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'payment_method',
      header: 'Method',
      cell: ({ row }: { row: any }) => row.original.payment_method || '-',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: { row: any }) => (
        <span className="text-gray-700">
          {row.original.description || 'N/A'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: any }) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleDelete(row.original.id)}
          disabled={isDeleting === row.original.id}
          className="text-red-500 hover:text-red-700"
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all transactions for this agreement</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-3 py-1">
            <CalendarIcon className="h-4 w-4" />
            <span>Monthly Rent: QAR {rentAmount?.toLocaleString() || '0'}</span>
          </div>
          <Button 
            onClick={() => setIsPaymentDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-52">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : payments.length > 0 ? (
          <div className="rounded-md border">
            <DataTable 
              columns={columns} 
              data={payments}
            />
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            No payment records found for this agreement.
          </div>
        )}
      </CardContent>

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handlePaymentSubmit}
        defaultAmount={rentAmount || 0}
        title="Record Payment"
        description="Enter payment details to record a payment"
      />
    </Card>
  );
}
