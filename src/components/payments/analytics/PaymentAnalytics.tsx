
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface PaymentAnalyticsProps {
  amountPaid: number;
  balance: number;
  lateFees: number;
  statistics?: {
    totalPaid: number;
    totalDue: number;
    totalLate: number;
    paymentCount: number;
    overdueCount: number;
  } | null;
}

export function PaymentAnalytics({ 
  amountPaid, 
  balance, 
  lateFees,
  statistics 
}: PaymentAnalyticsProps) {
  // Use statistics data if available, otherwise use passed-in props
  const totalPaid = statistics?.totalPaid ?? amountPaid;
  const totalDue = statistics?.totalDue ?? balance;
  const totalLate = statistics?.totalLate ?? lateFees;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Analytics</CardTitle>
        <CardDescription>Financial metrics for this agreement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold">QAR {formatCurrency(totalPaid)}</p>
            {statistics && (
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.paymentCount} payments recorded
              </p>
            )}
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
            <p className="text-2xl font-bold">QAR {formatCurrency(totalDue)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-muted-foreground">Late Fees</p>
            <p className="text-2xl font-bold">QAR {formatCurrency(totalLate)}</p>
            {statistics && statistics.overdueCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.overdueCount} overdue {statistics.overdueCount === 1 ? 'payment' : 'payments'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
