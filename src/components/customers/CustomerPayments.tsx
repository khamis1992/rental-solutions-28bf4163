
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Loader2, CalendarClock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CustomerPaymentsProps {
  customerId: string;
}

const CustomerPayments: React.FC<CustomerPaymentsProps> = ({ customerId }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!customerId) return;
      
      setLoading(true);
      try {
        // First get all leases for the customer
        const { data: leases, error: leaseError } = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);
        
        if (leaseError) throw leaseError;
        
        if (!leases || leases.length === 0) {
          setPayments([]);
          setLoading(false);
          return;
        }
        
        // Get all payments for these leases
        const leaseIds = leases.map(lease => lease.id);
        const { data, error } = await supabase
          .from('unified_payments')
          .select(`
            id,
            amount,
            amount_paid,
            payment_date,
            payment_method,
            status,
            type,
            description,
            lease_id,
            created_at,
            due_date
          `)
          .in('lease_id', leaseIds)
          .order('payment_date', { ascending: false });
        
        if (error) throw error;
        setPayments(data as any[]);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading payments...</span>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No payments found for this customer.</p>
        </CardContent>
      </Card>
    );
  }

  const totalPaid = payments
    .filter(payment => payment.status === 'completed' || payment.status === 'paid')
    .reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
  
  const totalPending = payments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Total Payments</span>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Total Paid</span>
          <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-card rounded-md p-4 border">
          <span className="text-sm text-muted-foreground">Pending Payments</span>
          <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
        </div>
      </div>
      
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-sm">Date</th>
              <th className="px-4 py-3 text-left font-medium text-sm">Description</th>
              <th className="px-4 py-3 text-left font-medium text-sm">Method</th>
              <th className="px-4 py-3 text-left font-medium text-sm">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {payment.payment_date ? (
                      <>
                        <CalendarClock className="mr-2 h-4 w-4 text-blue-500" />
                        {formatDate(payment.payment_date)}
                      </>
                    ) : payment.due_date ? (
                      <>
                        <CalendarClock className="mr-2 h-4 w-4 text-amber-500" />
                        {formatDate(payment.due_date)} (Due)
                      </>
                    ) : (
                      <>
                        <CalendarClock className="mr-2 h-4 w-4 text-gray-500" />
                        {formatDate(payment.created_at)}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{payment.description || 'Rent Payment'}</td>
                <td className="px-4 py-3">{payment.payment_method || 'N/A'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <DollarSign className="mr-1 h-4 w-4 text-green-500" />
                    {formatCurrency(payment.amount_paid || payment.amount || 0)}
                  </div>
                </td>
                <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerPayments;
