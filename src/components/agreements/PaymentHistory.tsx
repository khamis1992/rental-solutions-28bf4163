
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

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
}

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
}

export function PaymentHistory({ payments, isLoading }: PaymentHistoryProps) {
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  
  useEffect(() => {
    // Only fetch if we have payments (which means we have an agreement ID)
    if (payments.length > 0) {
      fetchPendingAmount();
    } else {
      setIsPendingLoading(false);
    }
  }, [payments]);
  
  const fetchPendingAmount = async () => {
    setIsPendingLoading(true);
    try {
      // Extract the agreement ID from the first payment's notes
      // This is a workaround as we don't directly have the agreement ID in the props
      const agreementId = payments.length > 0 && payments[0].notes?.match(/agreement_id:([a-zA-Z0-9-]+)/)?.[1];
      
      if (!agreementId) {
        setIsPendingLoading(false);
        return;
      }
      
      const { data, error } = await supabase.rpc('get_pending_payments_available', {
        agreement_id: agreementId
      });
      
      if (error) {
        console.error("Error fetching pending payments:", error);
        throw error;
      }
      
      setPendingAmount(data);
    } catch (error) {
      console.error("Failed to fetch pending payment amount:", error);
    } finally {
      setIsPendingLoading(false);
    }
  };
  
  const formatPaymentMethod = (method: string) => {
    return method
      ? method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : 'N/A';
  };

  // Add debug log to see if payments are being passed
  console.log("Payment history rendered with payments:", payments);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all payments for this agreement</CardDescription>
        </div>
        
        {pendingAmount !== null && !isPendingLoading && (
          <div className="mt-2 sm:mt-0 bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Pending Payments Available: {formatCurrency(pendingAmount)}
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading || isPendingLoading ? (
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
