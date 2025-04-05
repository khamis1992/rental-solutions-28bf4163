
import { AlertCircle } from 'lucide-react';

export const EmptyPaymentState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
      <AlertCircle className="mb-2 h-10 w-10" />
      <h3 className="text-lg font-medium">No payments found</h3>
      <p className="mt-1">No payment records exist for this agreement.</p>
    </div>
  );
};
