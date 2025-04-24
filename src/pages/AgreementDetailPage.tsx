
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
  const [paymentRefreshCounter, setPaymentRefreshCounter] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { 
    agreement, 
    deleteAgreement, 
    isLoading: isAgreementLoading,
    error: agreementError,
    rentAmount,
    contractAmount,
    refreshAgreement
  } = useAgreements(id);

  const { 
    payments, 
    isLoading: isPaymentsLoading,
    error: paymentsError,
    fetchPayments,
    addPayment
  } = usePayments(id);

  const { rentAmount: rentAmountFromHook } = useRentAmount(agreement, id);

  const { 
    handleSpecialAgreementPayments,
    isProcessing: isPaymentGenerationLoading,
    error: paymentGenerationError
  } = usePaymentGeneration(agreement, id);

  useEffect(() => {
    console.log("AgreementDetailPage: Loading with agreement ID:", id);
    if (id) {
      fetchPayments().catch(err => {
        console.error("Error fetching payments:", err);
        setLoadError("Failed to load payment data");
      });
    }
  }, [id, fetchPayments, paymentRefreshCounter]);

  useEffect(() => {
    if (agreementError) {
      console.error("Agreement loading error:", agreementError);
      setLoadError(`Failed to load agreement details: ${agreementError}`);
    } else if (paymentsError) {
      console.error("Payments loading error:", paymentsError);
      setLoadError(`Failed to load payment data: ${paymentsError}`);
    } else if (paymentGenerationError) {
      console.error("Payment generation error:", paymentGenerationError);
      setLoadError(`Payment system error: ${paymentGenerationError}`);
    } else {
      setLoadError(null);
    }
  }, [agreementError, paymentsError, paymentGenerationError]);

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
        // Trigger refresh of payments in child components
        setPaymentRefreshCounter(prev => prev + 1);
        toast.success("Payment recorded successfully");
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      toast.error("Failed to record payment");
    }
  }, [handleSpecialAgreementPayments, fetchPayments]);

  const handleOpenPaymentDialog = () => {
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentDeleted = useCallback(() => {
    console.log("Payment deleted, refreshing data...");
    fetchPayments();
    setPaymentRefreshCounter(prev => prev + 1);
  }, [fetchPayments]);

  const handleRetry = () => {
    setLoadError(null);
    refreshAgreement();
    fetchPayments();
  };

  if (isAgreementLoading) {
    return <div className="p-6 text-center">Loading agreement details...</div>;
  }

  if (loadError) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate('/agreements')}>Back to Agreements</Button>
          <Button className="ml-2" onClick={handleRetry}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="p-6">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Agreement Not Found</AlertTitle>
          <AlertDescription>The requested agreement could not be found or may have been deleted.</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate('/agreements')}>Back to Agreements</Button>
        </div>
      </div>
    );
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
          onPaymentDeleted={handlePaymentDeleted}
          leaseStartDate={agreement.start_date}
          leaseEndDate={agreement.end_date}
          agreementId={agreement.id}
        />
      </div>

      <Button 
        className="fixed bottom-8 right-8 bg-green-500 hover:bg-green-600" 
        onClick={handleOpenPaymentDialog}
      >
        Record Payment
      </Button>

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
