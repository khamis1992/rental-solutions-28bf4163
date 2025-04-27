
import React from 'react';
import { XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PaymentErrorProps {
  message: string;
  details?: string;
}

export const PaymentError: React.FC<PaymentErrorProps> = ({ message, details }) => {
  return (
    <Card className="p-4 bg-destructive/10 text-destructive">
      <div className="flex items-start space-x-3">
        <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium">{message}</p>
          {details && (
            <p className="text-sm text-destructive/80">{details}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
