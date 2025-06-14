
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { Payment } from '@/types/payment.types';

interface PaymentActionButtonProps {
  payment: Payment;
  onClick: () => void;
}

export function PaymentActionButton({ payment, onClick }: PaymentActionButtonProps) {
  if (payment.status === 'completed' || payment.status === 'paid') {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="min-w-[140px] opacity-75"
      >
        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
        Paid
      </Button>
    );
  }

  const isOverdue = payment.status === 'overdue';
  
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={`
        font-semibold shadow-md transition-all duration-200 hover:scale-105 min-w-[140px]
        ${isOverdue 
          ? 'bg-red-600 hover:bg-red-700 text-white border-red-700' 
          : 'bg-green-600 hover:bg-green-700 text-white border-green-700'
        }
      `}
      variant={isOverdue ? 'destructive' : 'default'}
    >
      <CreditCard className="h-4 w-4 mr-2" />
      {isOverdue ? 'Pay Overdue' : 'Clear Payment'}
    </Button>
  );
}
