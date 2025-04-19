
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

interface PaymentListProps {
  agreementId: string;
  onAddPayment?: () => void;
  onDeletePayment?: (paymentId: string) => void;
}

interface AgreementDetails {
  start_date: string;
  rent_amount: number;
}

export function PaymentList({ agreementId, onAddPayment, onDeletePayment }: PaymentListProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agreementDetails, setAgreementDetails] = useState<AgreementDetails | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        
        // Get agreement details first
        const agreementResponse = await supabase
          .from('leases')
          .select('start_date, rent_amount')
          .eq('id', agreementId)
          .single();
          
        if (hasData(agreementResponse)) {
          setAgreementDetails(agreementResponse.data as AgreementDetails);
        } else {
          console.error("Error fetching agreement details:", agreementResponse.error);
        }

        // Then get the payment data
        const paymentsResponse = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', agreementId)
          .order('payment_date', { ascending: false });

        if (hasData(paymentsResponse)) {
          setPayments(paymentsResponse.data as Payment[]);
        } else {
          console.error("Error fetching payments:", paymentsResponse.error);
          setPayments([]);
        }
      } catch (error) {
        console.error("Error in fetchPayments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (agreementId) {
      fetchPayments();
    }
  }, [agreementId]);

  // Generate rent due dates starting from agreement start date
  const generatePendingPayments = () => {
    if (!agreementDetails?.start_date) return [];
    
    const startDate = new Date(agreementDetails.start_date);
    const today = new Date();
    const rentAmount = agreementDetails.rent_amount || 0;
    
    let pendingPayments = [];
    let currentDate = new Date(startDate);
    
    // Assuming monthly payments
    while (currentDate <= today) {
      const paymentForMonth = payments.find(p => {
        const paymentDate = p.payment_date ? new Date(p.payment_date) : null;
        return paymentDate && 
               paymentDate.getMonth() === currentDate.getMonth() && 
               paymentDate.getFullYear() === currentDate.getFullYear();
      });
      
      if (!paymentForMonth) {
        pendingPayments.push({
          due_date: new Date(currentDate),
          amount: rentAmount
        });
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return pendingPayments;
  };
  
  const handleDeletePayment = async (id: string) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this payment?");
      if (!confirmed) return;
      
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting payment:", error);
      } else {
        setPayments(payments.filter(payment => payment.id !== id));
        if (onDeletePayment) onDeletePayment(id);
      }
    } catch (error) {
      console.error("Error in handleDeletePayment:", error);
    }
  };

  const pendingPayments = generatePendingPayments();

  if (isLoading) {
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

      {payments.length === 0 && pendingPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No Payments</h3>
          <p className="text-muted-foreground">No payment records found for this agreement.</p>
        </div>
      ) : (
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
            
            {/* Show pending payments */}
            {pendingPayments.map((pending, index) => (
              <TableRow key={`pending-${index}`} className="bg-muted/30">
                <TableCell>{format(pending.due_date, 'dd/MM/yyyy')}</TableCell>
                <TableCell>{formatCurrency(pending.amount)}</TableCell>
                <TableCell>
                  <Badge variant="destructive">Unpaid</Badge>
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>Pending Monthly Payment</TableCell>
                <TableCell className="text-right">
                  {onAddPayment && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onAddPayment}
                    >
                      Record Payment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default PaymentList;
