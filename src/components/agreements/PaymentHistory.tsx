
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  const formatPaymentMethod = (method: string) => {
    return method
      ? method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : 'N/A';
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
