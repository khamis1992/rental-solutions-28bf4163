
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, CreditCard } from 'lucide-react';
import PaymentForAgreement from './PaymentForAgreement';
import { NewPaymentEntry } from './NewPaymentEntry';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({ open, onOpenChange }: RecordPaymentDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'agreement' | 'new' | null>(null);

  const handleOptionSelect = (option: 'agreement' | 'new') => {
    setSelectedOption(option);
  };

  const handleBack = () => {
    setSelectedOption(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Choose how you would like to record this payment
          </DialogDescription>
        </DialogHeader>

        {!selectedOption ? (
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleOptionSelect('agreement')}
            >
              <CreditCard className="h-6 w-6" />
              <span className="font-semibold">Record Payment for an Agreement</span>
              <span className="text-sm text-muted-foreground">
                Record a payment for an existing rental agreement
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleOptionSelect('new')}
            >
              <FileText className="h-6 w-6" />
              <span className="font-semibold">Record a New Payment</span>
              <span className="text-sm text-muted-foreground">
                Record a standalone payment with optional invoice
              </span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedOption === 'agreement' ? (
              <PaymentForAgreement onBack={handleBack} onClose={() => onOpenChange(false)} />
            ) : (
              <NewPaymentEntry onBack={handleBack} onClose={() => onOpenChange(false)} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
