
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Wrench, AlertTriangle } from 'lucide-react';
import { usePaymentSync } from '@/hooks/payment/use-payment-sync';

interface PaymentSyncButtonProps {
  agreementId?: string;
  variant?: 'sync' | 'fix';
  className?: string;
}

export function PaymentSyncButton({ 
  agreementId,
  variant = 'sync',
  className = ''
}: PaymentSyncButtonProps) {
  const { 
    syncPaymentSchedule, 
    fixDuplicatePayments,
    generateMissingPayments,
    isPending 
  } = usePaymentSync();

  const handleSync = async () => {
    if (!agreementId) return;
    await syncPaymentSchedule.mutateAsync(agreementId);
  };

  const handleFix = async () => {
    if (!agreementId) return;
    await fixDuplicatePayments.mutateAsync(agreementId);
  };

  const handleGenerate = async () => {
    if (!agreementId) return;
    await generateMissingPayments.mutateAsync(agreementId);
  };

  if (variant === 'fix') {
    return (
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFix}
          disabled={isPending.fix || !agreementId}
          className={`h-8 px-2 text-xs ${className}`}
        >
          <Wrench className="h-3 w-3 mr-1" />
          Fix Duplicates
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isPending.generate || !agreementId}
          className={`h-8 px-2 text-xs ${className}`}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Generate Missing
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isPending.sync || !agreementId}
      className={`h-8 px-2 text-xs ${className}`}
    >
      <RefreshCcw className={`h-3 w-3 mr-1 ${isPending.sync ? 'animate-spin' : ''}`} />
      Sync Schedule
    </Button>
  );
}
