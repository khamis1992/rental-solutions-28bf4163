
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface PaymentAnalyticsProps {
  amountPaid: number;
  balance: number;
  lateFees: number;
}

export function PaymentAnalytics({ amountPaid, balance, lateFees }: PaymentAnalyticsProps) {
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
            <p className="text-2xl font-bold">QAR {formatCurrency(amountPaid)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
            <p className="text-2xl font-bold">QAR {formatCurrency(balance)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-muted-foreground">Late Fees</p>
            <p className="text-2xl font-bold">QAR {formatCurrency(lateFees)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
