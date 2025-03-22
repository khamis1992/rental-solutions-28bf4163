
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
}

export function PaymentHistory({ payments, isLoading }: PaymentHistoryProps) {
  const formatPaymentMethod = (method: string) => {
    return method
      ? method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : 'N/A';
  };

  // Get agreement ID from the first payment
  const agreementId = payments.length > 0 ? payments[0].lease_id : null;
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [isPendingLoading, setIsPendingLoading] = useState(false);

  useEffect(() => {
    // Only fetch pending payments if we have an agreement ID
    if (agreementId) {
      fetchPendingPayments(agreementId);
    } else if (payments.length > 0) {
      // Try to extract agreement ID from payment notes if lease_id is not directly available
      const firstPayment = payments[0];
      if (firstPayment.notes && firstPayment.notes.includes("for agreement")) {
        const match = firstPayment.notes.match(/for agreement ([A-Z0-9]+)/);
        if (match && match[1]) {
          // Now fetch the agreement ID using the agreement number
          fetchAgreementIdByNumber(match[1]);
        }
      }
    }
  }, [agreementId, payments]);

  // Function to fetch agreement ID by agreement number
  const fetchAgreementIdByNumber = async (agreementNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('agreements')
        .select('id')
        .eq('agreement_number', agreementNumber)
        .single();
      
      if (error) throw error;
      
      if (data && data.id) {
        fetchPendingPayments(data.id);
      }
    } catch (error) {
      console.error("Error fetching agreement ID:", error);
    }
  };

  // Function to fetch pending payments
  const fetchPendingPayments = async (agreementId: string) => {
    setIsPendingLoading(true);
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('amount')
        .eq('lease_id', agreementId)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      if (data) {
        setPendingPaymentsCount(data.length);
        const total = data.reduce((sum, payment) => sum + payment.amount, 0);
        setTotalPendingAmount(total);
      }
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    } finally {
      setIsPendingLoading(false);
    }
  };

  // Add debug log to see if payments are being passed
  console.log("Payment history rendered with payments:", payments);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View all payments for this agreement</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingPaymentsCount > 0 && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                There {pendingPaymentsCount === 1 ? 'is' : 'are'} <strong>{pendingPaymentsCount}</strong> pending {pendingPaymentsCount === 1 ? 'payment' : 'payments'} 
                {' '} totaling <strong>{formatCurrency(totalPendingAmount)}</strong>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No payments recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className={payment.type === 'LATE_PAYMENT_FEE' ? 'bg-amber-50' : ''}>
                    <TableCell>
                      {format(new Date(payment.payment_date), "PPP")}
                    </TableCell>
                    <TableCell>
                      {payment.type === 'LATE_PAYMENT_FEE' ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                          Late Fee
                        </Badge>
                      ) : payment.status === 'pending' ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Paid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                      {payment.days_overdue && payment.days_overdue > 0 && payment.type !== 'LATE_PAYMENT_FEE' && (
                        <div className="text-xs text-amber-600 mt-1">
                          +{payment.days_overdue} days late
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.payment_method ? formatPaymentMethod(payment.payment_method) : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.reference_number || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payment.notes || "-"}
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
