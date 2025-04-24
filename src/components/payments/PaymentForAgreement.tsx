
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { usePaymentDetails } from '@/hooks/use-payment-details';
import { usePayments } from '@/hooks/use-payments';

interface PaymentForAgreementProps {
  onBack: () => void;
  onClose: () => void;
}

export function PaymentForAgreement({ onBack, onClose }: PaymentForAgreementProps) {
  const [carNumber, setCarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data, isLoading, error } = usePaymentDetails(carNumber);
  const { addPayment } = usePayments(data?.agreementNumber || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only proceed if we have valid data
      if (!data?.agreementNumber) {
        throw new Error('No valid agreement found');
      }

      const paymentData = {
        amount: data.rentAmount,
        payment_date: new Date().toISOString(),
        lease_id: data.agreementNumber,
        payment_method: 'cash',
        description: 'Monthly rent payment',
        status: 'completed',
        type: 'Income',
        late_fine_amount: data.lateFeeAmount || 0
      };

      await addPayment(paymentData);
      
      toast({
        title: "Payment Recorded",
        description: "The payment has been successfully recorded.",
      });
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        className="mb-2"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-2">
        <Label htmlFor="carNumber">Car Number</Label>
        <Input
          id="carNumber"
          placeholder="Enter car number"
          value={carNumber}
          onChange={(e) => setCarNumber(e.target.value)}
          required
        />
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading payment details...</div>
      )}

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      {data && (
        <div className="rounded-lg border p-4 space-y-2">
          {data.agreementNumber && (
            <div className="flex justify-between text-sm">
              <span>Agreement Number:</span>
              <span className="font-semibold">{data.agreementNumber}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Rent Amount Due:</span>
            <span className="font-semibold">QAR {data.rentAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Late Payment Fee:</span>
            <span className="font-semibold text-destructive">
              QAR {data.lateFeeAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span>Total Due:</span>
            <span className="font-semibold">QAR {data.totalDue.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!carNumber || loading || isLoading || !!error || !data}
        >
          Record Payment
        </Button>
      </div>
    </form>
  );
}
