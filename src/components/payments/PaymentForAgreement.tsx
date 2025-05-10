
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { usePaymentDetails } from '@/hooks/use-payment-details';
import { usePayments } from '@/hooks/use-payments';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PaymentForAgreementProps {
  onBack: () => void;
  onClose: () => void;
}

export function PaymentForAgreement({ onBack, onClose }: PaymentForAgreementProps) {
  const [carNumber, setCarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const { toast } = useToast();
  const { data, isLoading, error } = usePaymentDetails(carNumber);
  const { addPayment } = usePayments();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only proceed if we have valid data
      if (!data?.leaseId) {
        throw new Error('No valid agreement found');
      }

      // If a specific payment is selected, use that payment
      let paymentData;
      
      if (selectedPaymentId && selectedPaymentId !== 'new') {
        // Find the selected pending payment
        const selectedPayment = data.pendingPayments.find(p => p.id === selectedPaymentId);
        
        if (!selectedPayment) {
          throw new Error('Selected payment not found');
        }

        // Update the existing payment to mark it as completed
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update({
            status: 'completed',
            payment_date: new Date().toISOString(),
            payment_method: 'cash',
            description: `Payment for ${data.agreementNumber}`
          })
          .eq('id', selectedPaymentId);

        if (updateError) throw updateError;
        
        toast({
          title: "Payment Recorded",
          description: `The selected payment of ${selectedPayment.amount} QAR has been marked as completed.`,
        });
      } else {
        // Create a new payment if no specific payment was selected or "new" was selected
        paymentData = {
          amount: data.rentAmount,
          payment_date: new Date().toISOString(),
          lease_id: data.leaseId,
          payment_method: 'cash',
          description: `Monthly rent payment for ${data.agreementNumber}`,
          status: 'completed',
          type: 'Income',
          late_fine_amount: data.lateFeeAmount || 0
        };

        await addPayment(paymentData);
        
        toast({
          title: "Payment Recorded",
          description: "The payment has been successfully recorded.",
        });
      }
      
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
          onChange={(e) => {
            setCarNumber(e.target.value);
            setSelectedPaymentId(null); // Reset selection when car number changes
          }}
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
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            {data.agreementNumber && (
              <div className="flex justify-between text-sm">
                <span>Agreement Number:</span>
                <span className="font-semibold">{data.agreementNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Current Rent Amount:</span>
              <span className="font-semibold">QAR {data.rentAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Late Payment Fee:</span>
              <span className="font-semibold text-destructive">
                QAR {data.lateFeeAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Default Total Due:</span>
              <span className="font-semibold">QAR {data.totalDue.toFixed(2)}</span>
            </div>
            {data.contractAmount !== null && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Contract Amount:</span>
                <span>QAR {data.contractAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {data.pendingPayments && data.pendingPayments.length > 0 && (
            <div className="space-y-2">
              <Label>Select a Payment to Record</Label>
              <RadioGroup 
                value={selectedPaymentId || ''} 
                onValueChange={setSelectedPaymentId}
                className="space-y-2"
              >
                {data.pendingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value={payment.id} id={payment.id} />
                    <div className="grid flex-1">
                      <div className="flex justify-between">
                        <Label htmlFor={payment.id} className="font-medium">
                          QAR {payment.amount.toFixed(2)}
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          {payment.description || 'Payment'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Due: {payment.due_date ? formatDate(payment.due_date) : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="new" id="new-payment" />
                  <div className="grid flex-1">
                    <Label htmlFor="new-payment" className="font-medium">Create New Payment</Label>
                    <span className="text-sm text-muted-foreground">
                      Amount: QAR {data.totalDue.toFixed(2)} (Rent + Late Fee)
                    </span>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!carNumber || loading || isLoading || !!error || !data || (data.pendingPayments.length > 0 && !selectedPaymentId && selectedPaymentId !== 'new')}
        >
          Record Payment
        </Button>
      </div>
    </form>
  );
}
