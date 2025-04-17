
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface CustomerPaymentsProps {
  customerId: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  description?: string;
  agreement_number?: string;
}

const CustomerPayments = ({ customerId }: CustomerPaymentsProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        // Get all leases for this customer
        const { data: leases, error: leaseError } = await supabase
          .from('leases')
          .select('id, agreement_number')
          .eq('customer_id', customerId);

        if (leaseError) throw leaseError;

        if (!leases || leases.length === 0) {
          setPayments([]);
          setLoading(false);
          return;
        }

        // Get all payments for these leases
        const leaseIds = leases.map(lease => lease.id);
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .in('lease_id', leaseIds);

        if (paymentsError) throw paymentsError;

        // Map lease agreement numbers to payments
        const enhancedPayments = (paymentsData || []).map(payment => {
          const lease = leases.find(l => l.id === payment.lease_id);
          return {
            ...payment,
            agreement_number: lease?.agreement_number || 'Unknown'
          };
        });

        setPayments(enhancedPayments as Payment[]);
      } catch (error) {
        console.error('Error fetching customer payments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchPayments();
    }
  }, [customerId]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge>{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading payment history...</span>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No payment records found for this customer.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="border rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Agreement</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(payment => (
              <TableRow key={payment.id}>
                <TableCell>
                  {payment.payment_date && format(new Date(payment.payment_date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>{payment.agreement_number}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                <TableCell>{payment.description || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CustomerPayments;
