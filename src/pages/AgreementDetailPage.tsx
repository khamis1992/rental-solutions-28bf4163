import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { Agreement } from '@/lib/validation-schemas/agreement';
import { useAgreements } from '@/hooks/use-agreements';
import { usePayments } from '@/hooks/use-payments';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';

import { AgreementOverviewSection } from '@/components/agreements/AgreementOverviewSection';
import { AgreementDetailsTab } from '@/components/agreements/AgreementDetailsTab';
import { AgreementPaymentsTab } from '@/components/agreements/AgreementPaymentsTab';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';

export function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { 
    agreement, 
    deleteAgreement, 
    isLoading: isAgreementLoading,
    rentAmount,
    contractAmount,
    refreshAgreement
  } = useAgreements(id);

  const { 
    payments, 
    isLoading: isPaymentsLoading,
    fetchPayments,
    addPayment
  } = usePayments(id);

  const { rentAmount: rentAmountFromHook } = useRentAmount(agreement, id);

  const { 
    handleSpecialAgreementPayments,
    isProcessing: isPaymentGenerationLoading
  } = usePaymentGeneration(agreement, id);

  const handleDelete = useCallback(() => {
    if (agreement) {
      deleteAgreement(agreement.id);
      navigate('/agreements');
    }
  }, [agreement, deleteAgreement, navigate]);

  const handlePaymentSubmit = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => {
    try {
      console.log("Starting payment submission...", { amount, paymentDate, notes });
      
      // Use the specialized payment handler from the hook
      const success = await handleSpecialAgreementPayments(
        amount,
        paymentDate,
        notes,
        paymentMethod || 'cash',
        referenceNumber,
        includeLatePaymentFee || false,
        isPartialPayment || false
      );
      
      console.log("Payment submission result:", success);
      
      if (success) {
        setIsPaymentDialogOpen(false);
        console.log("Refreshing payments after successful submission...");
        await fetchPayments();
        toast.success("Payment recorded successfully");
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      toast.error("Failed to record payment");
    }
  }, [handleSpecialAgreementPayments, fetchPayments]);

  if (isAgreementLoading || !agreement) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <AgreementOverviewSection 
        agreement={agreement}
        rentAmount={rentAmountFromHook}
        contractAmount={contractAmount}
        onDelete={() => setIsDeleteDialogOpen(true)}
        onEdit={() => navigate(`/agreements/edit/${agreement.id}`)}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <AgreementDetailsTab 
          agreement={agreement}
          rentAmount={rentAmountFromHook}
          contractAmount={contractAmount}
        />
        
        <AgreementPaymentsTab 
          payments={payments}
          isLoading={isPaymentsLoading}
          rentAmount={rentAmountFromHook}
          onPaymentDeleted={fetchPayments}
          leaseStartDate={agreement.start_date}
          leaseEndDate={agreement.end_date}
          agreementId={agreement.id}
        />
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agreement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentEntryDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen} 
        onSubmit={handlePaymentSubmit}
        defaultAmount={rentAmountFromHook || 0}
        title="Record Rent Payment"
        description="Enter payment details for this agreement"
      />
    </div>
  );
}
