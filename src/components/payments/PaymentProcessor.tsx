
import React from 'react';
import { Dialog } from "@/components/ui/dialog";
import { CustomButton } from "@/components/ui/custom-button";
import { CreditCard, Wallet, Loader2 } from 'lucide-react';
import { usePaymentQuery } from '@/hooks/use-payment-query';
import { toast } from 'sonner';

export const PaymentProcessor = ({
  amount,
  agreementId,
  paymentOptions,
  onSuccess,
  onCancel
}: {
  amount: number;
  agreementId: string;
  paymentOptions?: {
    paymentDate?: Date;
    notes?: string;
    paymentType?: string;
    includeLatePaymentFee?: boolean;
  };
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const [loading, setLoading] = React.useState(false);
  const { processSpecialPayment } = usePaymentQuery();
  
  const handlePayment = async (method: 'card' | 'wallet') => {
    if (!agreementId) {
      toast.error('Agreement ID is required to process payment');
      return;
    }
    
    setLoading(true);
    try {
      // Create a mutation for processing the payment
      const processPayment = processSpecialPayment();
      
      // Process the payment through the standardized service
      await processPayment.mutateAsync({
        agreementId,
        amount,
        paymentDate: paymentOptions?.paymentDate || new Date(),
        options: {
          paymentMethod: method === 'card' ? 'credit_card' : 'digital_wallet',
          notes: paymentOptions?.notes || `Payment processed via ${method === 'card' ? 'credit card' : 'digital wallet'}`,
          includeLatePaymentFee: paymentOptions?.includeLatePaymentFee || false,
          paymentType: paymentOptions?.paymentType || 'rent'
        }
      });
      
      toast.success('Payment processed successfully');
      onSuccess();
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CustomButton
        onClick={() => handlePayment('card')}
        disabled={loading}
        className="p-6"
      >
        {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CreditCard className="h-6 w-6 mr-2" />}
        Pay with Card
      </CustomButton>
      
      <CustomButton
        onClick={() => handlePayment('wallet')}
        disabled={loading}
        className="p-6"
      >
        {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Wallet className="h-6 w-6 mr-2" />}
        Digital Wallet
      </CustomButton>
    </div>
  );
};
