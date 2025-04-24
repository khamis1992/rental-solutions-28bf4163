
import React from 'react';
import { AlertCircle } from 'lucide-react';

export const EmptyPaymentState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
      <h3 className="text-lg font-semibold">No Payments</h3>
      <p className="text-muted-foreground">No payment records found for this agreement.</p>
    </div>
  );
};
