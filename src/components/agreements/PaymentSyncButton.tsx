
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, Zap } from 'lucide-react';
import { usePaymentSync } from '@/hooks/payment/use-payment-sync';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';

interface PaymentSyncButtonProps {
  agreementId: string;
  variant?: 'sync' | 'fix' | 'compact';
  showText?: boolean;
  className?: string;
}

export function PaymentSyncButton({ 
  agreementId, 
  variant = 'sync',
  showText = true,
  className = ''
}: PaymentSyncButtonProps) {
  const { 
    syncAgreement, 
    fixAgreementSync, 
    isPending,
    syncResults 
  } = usePaymentSync();

  const handleSync = async () => {
    try {
      if (variant === 'fix') {
        await fixAgreementSync(agreementId);
      } else {
        await syncAgreement(agreementId);
      }
    } catch (error) {
      console.error('Sync operation failed:', error);
    }
  };

  const getButtonProps = () => {
    switch (variant) {
      case 'fix':
        return {
          icon: <Zap className="h-4 w-4" />,
          text: 'Fix Payment Sync',
          tooltip: 'Fix payment synchronization issues',
          variant: 'destructive' as const,
          isPending: isPending.fix
        };
      case 'compact':
        return {
          icon: <RefreshCw className="h-3 w-3" />,
          text: 'Sync',
          tooltip: 'Sync payment data',
          variant: 'outline' as const,
          isPending: isPending.sync
        };
      default:
        return {
          icon: <RefreshCw className="h-4 w-4" />,
          text: 'Sync Payments',
          tooltip: 'Synchronize payment schedule and data',
          variant: 'outline' as const,
          isPending: isPending.sync
        };
    }
  };

  const buttonProps = getButtonProps();

  if (variant === 'compact') {
    return (
      <LoadingButton
        size="sm"
        variant={buttonProps.variant}
        onClick={handleSync}
        loading={buttonProps.isPending}
        className={`${className}`}
        title={buttonProps.tooltip}
      >
        {buttonProps.icon}
        {showText && <span className="ml-1">{buttonProps.text}</span>}
      </LoadingButton>
    );
  }

  return (
    <LoadingButton
      variant={buttonProps.variant}
      onClick={handleSync}
      loading={buttonProps.isPending}
      className={className}
      title={buttonProps.tooltip}
    >
      {buttonProps.icon}
      {showText && <span className="ml-2">{buttonProps.text}</span>}
    </LoadingButton>
  );
}
