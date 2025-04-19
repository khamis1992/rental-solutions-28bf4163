import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertCircle, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Payment } from '@/hooks/use-payments';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/supabase-type-helpers';
import { useRentAmount } from '@/hooks/use-rent-amount';

interface PaymentListProps {
  agreementId: string;
  onAddPayment?: () => void;
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentList({ agreementId, onAddPayment, onDeletePayment }: PaymentListProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the existing useRentAmount hook to fetch rent amount
  const { rentAmount, isLoading: isRentLoading } = useRentAmount(null, agreementId);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', agreementId)
          .order('payment_date', { ascending: false });

        if (error) {
          console.error('Error fetching payments:', error);
          return;
        }

        if (data) {
          setPayments(data as Payment[]);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (agreementId) {
      fetchPayments();
    }
  }, [agreementId]);

  const handleDeletePayment = async (id: string) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this payment?');
      if (!confirmed) return;
      
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting payment:', error);
        return;
      }
      
      setPayments(payments.filter(payment => payment.id !== id));
      if (onDeletePayment) onDeletePayment(id);
    } catch (error) {
      console.error('Error in handleDeletePayment:', error);
    }
  };

  if (isLoading || isRentLoading) {
    return <div className="flex items-center justify-center p-4">Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment History</h3>
        {onAddPayment && (
          <Button onClick={onAddPayment} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Payment
          </Button>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No Payments</h3>
          <p className="text-muted-foreground">No payment records found for this agreement.</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-2">
            Monthly Rent: QAR {rentAmount?.toLocaleString() || '0'}
          </div>
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
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'outline' : 'secondary'}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{payment.description || 'Payment'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeletePayment(payment.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
};

export default PaymentList;
