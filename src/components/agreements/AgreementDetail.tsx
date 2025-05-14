
import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import { useLoadingStates } from '@/hooks/payment/use-loading-states';
import { useDialogVisibility } from '@/utils/api/dialog-utils';
import { useSpecialPayment } from '@/hooks/payment/use-special-payment';
import { usePaymentManagement } from '@/hooks/payment/use-payment-management';
import { toast } from 'sonner';
import { Payment } from '@/types/payment-types.unified';
import { Agreement } from '@/types/agreement';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui/loading-button";
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { CustomerInformationCard } from '@/components/agreements/details/CustomerInformationCard';
import { VehicleInformationCard } from '@/components/agreements/details/VehicleInformationCard';
import { AgreementDetailsCard } from '@/components/agreements/details/AgreementDetailsCard';
import { AgreementActionButtons } from '@/components/agreements/details/AgreementActionButtons';
import { LegalCaseCard } from '@/components/agreements/LegalCaseCard';
import { AgreementTrafficFines } from '@/components/agreements/AgreementTrafficFines';

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

  const [lateFeeDetails, setLateFeeDetails] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Use payment management hook
  const {
    payments = [],
    isLoading,
    updatePayment,
    addPayment,
    deletePayment,
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

  const handleDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
    }
  }, [agreement, onDelete]);

  const confirmDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
      closeDialog('delete');
    }
  }, [agreement, onDelete, closeDialog]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleEdit = useCallback(() => {
    if (agreement) {
      navigate(`/agreements/edit/${agreement.id}`);
    }
  }, [agreement, navigate]);

  const handleDownloadPdf = useCallback(async () => {
    if (agreement) {
      try {
        setLoading('generatingPdf');
        toast.info("Preparing agreement PDF document...");
        // Using onGenerateDocument instead of generatePdfDocument
        if (onGenerateDocument) {
          onGenerateDocument();
          toast.success("Agreement PDF downloaded successfully");
        } else {
          toast.error("PDF generation not configured");
        }
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF");
      } finally {
        setIdle('generatingPdf');
      }
    }
  }, [agreement, setLoading, setIdle, onGenerateDocument]);

  const handleGenerateDocument = useCallback(() => {
    if (agreement && onGenerateDocument) {
      onGenerateDocument();
    } else {
      toast.info("Document generation functionality is being configured");
    }
  }, [agreement, onGenerateDocument]);

  const handlePaymentSubmit = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string, 
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    paymentType?: string
  ) => {
    if (agreement && agreement.id) {
      try {
        const success = await processPayment(amount, paymentDate, {
          notes,
          paymentMethod,
          referenceNumber,
          includeLatePaymentFee,
          isPartialPayment,
          paymentType
        });
        
        if (success) {
          closeDialog('payment');
          onDataRefresh();
          toast.success("Payment recorded successfully");
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error recording payment:", error);
        toast.error("Failed to record payment");
        return false;
      }
    }
    return false;
  }, [agreement, processPayment, onDataRefresh, closeDialog]);

  const handlePaymentUpdate = useCallback(async (updatedPayment: Partial<Payment>): Promise<boolean> => {
    if (!agreement?.id || !updatedPayment.id) return false;
    
    try {
      await updatePayment({
        id: updatedPayment.id,
        data: updatedPayment
      });
      onDataRefresh();
      toast.success("Payment updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
      return false;
    }
  }, [agreement?.id, updatePayment, onDataRefresh]);

  const handleDeletePayment = useCallback(async (paymentId: string) => {
    if (!agreement?.id) return;
    
    try {
      await deletePayment(paymentId);
      onDataRefresh();
      if (onPaymentDeleted) {
        onPaymentDeleted();
      }
      toast.success("Payment deleted successfully");
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  }, [agreement?.id, deletePayment, onDataRefresh, onPaymentDeleted]);

  const handleUpdateHistoricalPaymentStatuses = async () => {
    if (!agreement) return;
    
    try {
      await updateHistoricalStatuses();
      onDataRefresh();
    } catch (error) {
      console.error("Error updating payment statuses:", error);
      toast.error("Failed to update payment statuses");
    }
  };

  if (!agreement) {
    return <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>;
  }

  const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
  const duration = differenceInMonths(endDate, startDate) || 1;

  const formattedStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500 text-white ml-2">ACTIVE</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white ml-2">PENDING</Badge>;
      case 'closed':
        return <Badge className="bg-blue-500 text-white ml-2">CLOSED</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white ml-2">CANCELLED</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500 text-white ml-2">EXPIRED</Badge>;
      case 'draft':
        return <Badge className="bg-purple-500 text-white ml-2">DRAFT</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white ml-2">{status.toUpperCase()}</Badge>;
    }
  };

  const createdDate = agreement.created_at instanceof Date ? agreement.created_at : new Date(agreement.created_at || new Date());

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight print:text-2xl">
          Agreement {agreement.agreement_number}
          {formattedStatus(agreement.status)}
        </h2>
        <p className="text-muted-foreground">
          Created on {format(createdDate, 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CustomerInformationCard agreement={agreement} />
        <VehicleInformationCard agreement={agreement} />
      </div>

      <AgreementDetailsCard 
        agreement={agreement}
        duration={duration}
        rentAmount={rentAmount}
        contractAmount={contractAmount}
      />

      <div className="flex items-center justify-between">
        <AgreementActionButtons 
          onEdit={handleEdit}
          onDownloadPdf={handleDownloadPdf}
          onGenerateDocument={handleGenerateDocument}
          onDelete={() => openDialog('delete')}
          isGeneratingPdf={loadingStates.generatingPdf}
          loadingStates={loadingStates}
        />
        
        <LoadingButton
          variant="outline"
          onClick={handleUpdateHistoricalPaymentStatuses}
          loadingKey="updateHistoricalStatuses"
          loadingStates={paymentLoadingStates}
          loadingText="Updating..."
        >
          Complete Historical Payments
        </LoadingButton>
      </div>

      {agreement && <PaymentHistory 
        payments={Array.isArray(payments) ? payments : []} 
        isLoading={isLoading} 
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        onPaymentDeleted={handleDeletePayment}
        onPaymentUpdated={handlePaymentUpdate}
        onRecordPayment={(payment) => {
          if (payment && agreement.id) {
            const fullPayment = {
              ...payment,
              lease_id: agreement.id,
              status: 'completed'
            };
            addPayment(fullPayment);
          }
        }}
        leaseStartDate={agreement.start_date} 
        leaseEndDate={agreement.end_date}
        leaseId={agreement.id}
      />}

      {agreement.start_date && agreement.end_date && (
        <LegalCaseCard agreementId={agreement.id} />
      )}

      {agreement.start_date && agreement.end_date && <Card>
          <CardContent className="pt-6">
            <AgreementTrafficFines agreementId={agreement.id} startDate={startDate} endDate={endDate} />
          </CardContent>
        </Card>}

      {/* Dialog for delete confirmation - now using the centralized dialog state */}
      <Dialog open={isDialogVisible('delete')} onOpenChange={open => !open && closeDialog('delete')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete agreement {agreement.agreement_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('delete')}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment dialog - now using the centralized dialog state */}
      <PaymentEntryDialog 
        open={isDialogVisible('payment')} 
        onOpenChange={open => {
          if (!open) closeDialog('payment');
          else openDialog('payment');
        }}
        onSubmit={handlePaymentSubmit} 
        defaultAmount={rentAmount || 0} 
        title="Record Rent Payment" 
        description="Record a new rental payment for this agreement." 
        lateFeeDetails={lateFeeDetails} 
        selectedPayment={selectedPayment}
      />
    </div>
  );
}
