
import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { Agreement } from '@/types/agreement';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import LegalCaseCard from './LegalCaseCard';
import { Payment } from '@/types/payment.types';
import { CustomerInformationCard } from './details/CustomerInformationCard';
import { VehicleInformationCard } from './details/VehicleInformationCard';
import { AgreementDetailsCard } from './details/AgreementDetailsCard';
import { AgreementActionButtons } from './details/AgreementActionButtons';
import { usePaymentManagement } from '@/hooks/payment/use-payment-management';
import { useLoadingStates } from '@/hooks/payment/use-loading-states';
import { useDialogVisibility } from '@/utils/api/dialog-utils';
import { useSpecialPayment } from '@/hooks/payment/use-special-payment';
import { PaymentSyncButton } from './PaymentSyncButton';
import { PaymentDebugPanel } from '@/components/debug/PaymentDebugPanel';

interface AgreementDetailProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
  onGenerateDocument?: () => void;
}

export function AgreementDetail({
  agreement,
  onDelete,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onDataRefresh,
  onGenerateDocument
}: AgreementDetailProps) {
  const navigate = useNavigate();
  
  // Use the dialog management hook
  const { dialogs, openDialog, closeDialog, isDialogVisible } = useDialogVisibility({
    delete: false,
    payment: false
  });
  
  // Use our loading states hook for PDF generation
  const { loadingStates, setLoading, setIdle } = useLoadingStates({
    generatingPdf: false
  });

  const [lateFeeDetails, setLateFeeDetails] = useState(null as {
    amount: number;
    daysLate: number;
  } | null);
  const [selectedPayment, setSelectedPayment] = useState(null as Payment | null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Use payment management hook
  const {
    payments,
    isLoading: isLoadingPayments,
    updatePayment: updatePaymentMutation,
    addPayment: addPaymentMutation,
    deletePayment: deletePaymentMutation,
    updateHistoricalStatuses,
    loadingStates: paymentLoadingStates
  } = usePaymentManagement(agreement?.id);
  
  // Use special payment hook
  const { processPayment, calculateLateFee } = useSpecialPayment(agreement?.id);
  
  // Calculate late fee on component mount
  useEffect(() => {
    const today = new Date();
    if (today.getDate() > 1) {
      const { amount, daysLate } = calculateLateFee(today);
      setLateFeeDetails({ amount, daysLate });
    } else {
      setLateFeeDetails(null);
    }
  }, [calculateLateFee]);

  // Handle agreement deletion
  const handleDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
    }
  }, [agreement, onDelete]);

  // Confirm delete dialog
  const confirmDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
      closeDialog('delete');
    }
  }, [agreement, onDelete, closeDialog]);

  // Print functionality
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Edit agreement
  const handleEdit = useCallback(() => {
    if (agreement) {
      navigate(`/agreements/edit/${agreement.id}`);
    }
  }, [agreement, navigate]);

  // Helper function to safely convert date string to Date object
  const ensureDate = (dateValue: string | Date): Date => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    return dateValue;
  };

  // Download PDF - ensure dates are Date objects
  const handleDownloadPdf = useCallback(async () => {
    if (agreement) {
      try {
        setLoading('generatingPdf');
        toast.info("Preparing agreement PDF document...");
        
        // Ensure dates are Date objects for the PDF generation utility
        const agreementForPdf = {
          ...agreement,
          start_date: ensureDate(agreement.start_date),
          end_date: ensureDate(agreement.end_date),
          created_at: ensureDate(agreement.created_at),
          updated_at: ensureDate(agreement.updated_at),
        };
        
        const success = await generatePdfDocument(agreementForPdf as any);
        
        if (success) {
          toast.success("Agreement PDF generated successfully");
        } else {
          toast.error("Failed to generate PDF document");
        }
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF document");
      } finally {
        setIdle('generatingPdf');
      }
    }
  }, [agreement, setLoading, setIdle]);

  // Record payment
  const handleRecordPayment = useCallback(async (payment: Partial<Payment>) => {
    try {
      await addPaymentMutation(payment);
      onDataRefresh();
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  }, [addPaymentMutation, onDataRefresh]);

  // Update payment - fix the mutation call
  const handleUpdatePayment = useCallback(async (payment: Partial<Payment>) => {
    if (payment.id) {
      try {
        const success = await updatePaymentMutation.mutateAsync({ id: payment.id, data: payment });
        if (success) {
          onDataRefresh();
        }
        return success;
      } catch (error) {
        console.error('Failed to update payment:', error);
        return false;
      }
    }
    return false;
  }, [updatePaymentMutation, onDataRefresh]);

  // Delete payment - fix the mutation call
  const handleDeletePayment = useCallback(async (paymentId: string) => {
    try {
      await deletePaymentMutation.mutateAsync(paymentId);
      onPaymentDeleted();
    } catch (error) {
      console.error('Failed to delete payment:', error);
    }
  }, [deletePaymentMutation, onPaymentDeleted]);

  if (!agreement) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No agreement selected
        </div>
      </Card>
    );
  }

  // Calculate duration for details card - handle both string and Date types
  const startDate = ensureDate(agreement.start_date);
  const endDate = ensureDate(agreement.end_date);
  const duration = startDate && endDate ? differenceInMonths(endDate, startDate) : 0;

  // Helper function to get date string safely
  const getDateString = (date: string | Date): string => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString();
  };

  return (
    <div className="space-y-6">
      {/* Debug Panel Toggle */}
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-xs"
          >
            {showDebugPanel ? 'Hide' : 'Show'} Debug
          </Button>
          <PaymentSyncButton 
            agreementId={agreement.id} 
            variant="fix"
            className="text-xs"
          />
        </div>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <PaymentDebugPanel 
          agreement={agreement} 
          isOpen={showDebugPanel}
        />
      )}

      {/* Agreement Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerInformationCard agreement={agreement} />
        <VehicleInformationCard agreement={agreement} />
      </div>

      <AgreementDetailsCard 
        agreement={agreement}
        duration={duration}
        rentAmount={rentAmount}
        contractAmount={contractAmount}
      />
      
      {/* Action Buttons */}
      <AgreementActionButtons
        onEdit={handleEdit}
        onDelete={() => openDialog('delete')}
        onDownloadPdf={handleDownloadPdf}
        onGenerateDocument={onGenerateDocument}
        isGeneratingPdf={loadingStates.generatingPdf}
      />

      {/* Payment History Section */}
      <PaymentHistory
        payments={payments}
        isLoading={isLoadingPayments}
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        onPaymentDeleted={handleDeletePayment}
        onPaymentUpdated={handleUpdatePayment}
        onRecordPayment={handleRecordPayment}
        leaseStartDate={getDateString(agreement.start_date)}
        leaseEndDate={getDateString(agreement.end_date)}
        leaseId={agreement.id}
        agreement={agreement}
      />

      {/* Traffic Fines Section */}
      <AgreementTrafficFines 
        agreementId={agreement.id}
        startDate={getDateString(agreement.start_date)}
        endDate={getDateString(agreement.end_date)}
      />

      {/* Legal Cases Section */}
      <LegalCaseCard 
        agreementId={agreement.id}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDialogVisible('delete')} onOpenChange={() => closeDialog('delete')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agreement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agreement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('delete')}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Entry Dialog */}
      {isDialogVisible('payment') && (
        <PaymentEntryDialog
          open={isDialogVisible('payment')}
          onOpenChange={() => closeDialog('payment')}
          onSubmit={async (amount, date, notes, method, reference) => {
            const payment: Partial<Payment> = {
              amount,
              payment_date: date.toISOString(),
              description: notes,
              payment_method: method,
              reference_number: reference,
              lease_id: agreement.id,
              status: 'completed'
            };
            await handleRecordPayment(payment);
            closeDialog('payment');
            return true;
          }}
          defaultAmount={rentAmount || 0}
          title="Record Payment"
          description="Add a new payment to this agreement"
          leaseId={agreement.id}
          rentAmount={rentAmount}
          selectedPayment={selectedPayment}
        />
      )}
    </div>
  );
}
