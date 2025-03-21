
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayments } from '@/hooks/use-payments';
import { PaymentStatus } from '@/types/payment';
import { DollarSign, CreditCard, AlertCircle } from 'lucide-react';

const FinancialSummary = () => {
  const { useList } = usePayments();
  const { data: payments, isLoading } = useList();
  
  // Calculate financial metrics
  const totalRevenue = payments?.reduce((sum, payment) => 
    payment.status === 'paid' ? sum + payment.amount : sum, 0) || 0;
  
  const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;
  
  const overduePayments = payments?.filter(p => p.status === 'overdue').length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total collected payments
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Payments
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPayments}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting payment processing
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Overdue Payments
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overduePayments}</div>
          <p className="text-xs text-muted-foreground">
            Payments past due date
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;
