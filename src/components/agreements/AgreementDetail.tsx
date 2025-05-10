import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { usePayments } from '@/hooks/use-payments';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import LegalCaseCard from './LegalCaseCard';
import { Payment } from '@/types/payment-history.types';
import { CustomerInformationCard } from './details/CustomerInformationCard';
import { VehicleInformationCard } from './details/VehicleInformationCard';
import { AgreementDetailsCard } from './details/AgreementDetailsCard';
import { AgreementActionButtons } from './details/AgreementActionButtons';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lateFeeDetails, setLateFeeDetails] = useState<{
    amount: number;
    daysLate: number;
  } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const {
    payments = [],
    isLoading,
    fetchPayments,
    updatePayment,
    addPayment,
    deletePayment
  } = usePayments(agreement?.id);
  
  useEffect(() => {
    if (agreement?.id) {
      console.log('Fetching payments for agreement:', agreement.id);
      fetchPayments();
    }
  }, [agreement?.id, fetchPayments]);
  
  const {
    handleSpecialAgreementPayments
  } = usePaymentGeneration(agreement, agreement?.id);

  const handleDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
    }
  }, [agreement, onDelete]);

  const confirmDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
      setIsDeleteDialogOpen(false);
    }
  }, [agreement, onDelete]);

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
        setIsGeneratingPdf(true);
        toast.info("Preparing agreement PDF document...");
        const success = await generatePdfDocument(agreement);
        if (success) {
          toast.success("Agreement PDF downloaded successfully");
        } else {
          toast.error("Failed to generate PDF");
        }
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF");
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  }, [agreement]);

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
    isPartialPayment?: boolean
  ) => {
    if (agreement && agreement.id) {
      try {
        const success = await handleSpecialAgreementPayments(
          amount, 
          paymentDate, 
          notes, 
          paymentMethod, 
          referenceNumber, 
          includeLatePaymentFee,
          isPartialPayment
        );
        if (success) {
          setIsPaymentDialogOpen(false);
          onDataRefresh();
          fetchPayments();
          toast.success("Payment recorded successfully");
        }
      } catch (error) {
        console.error("Error recording payment:", error);
        toast.error("Failed to record payment");
      }
    }
  }, [agreement, handleSpecialAgreementPayments, onDataRefresh, fetchPayments]);

  const handlePaymentUpdate = useCallback(async (updatedPayment: Partial<Payment>): Promise<boolean> => {
    if (!agreement?.id || !updatedPayment.id) return false;
    
    try {
      await updatePayment({
        id: updatedPayment.id,
        data: updatedPayment
      });
      onDataRefresh();
      fetchPayments();
      toast.success("Payment updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
      return false;
    }
  }, [agreement?.id, updatePayment, onDataRefresh, fetchPayments]);

  const handleDeletePayment = useCallback(async (paymentId: string) => {
    if (!agreement?.id) return;
    
    try {
      await deletePayment(paymentId);
      onDataRefresh();
      fetchPayments();
      toast.success("Payment deleted successfully");
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  }, [agreement?.id, deletePayment, onDataRefresh, fetchPayments]);

  const calculateDuration = useCallback((startDate: Date, endDate: Date) => {
    const months = differenceInMonths(endDate, startDate);
    return months > 0 ? months : 1;
  }, []);

  useEffect(() => {
    const today = new Date();
    if (today.getDate() > 1) {
      const daysLate = today.getDate() - 1;
      const lateFeeAmount = Math.min(daysLate * 120, 3000);

      setLateFeeDetails({
        amount: lateFeeAmount,
        daysLate: daysLate
      });
    } else {
      setLateFeeDetails(null);
    }
  }, []);

  if (!agreement) {
    return <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>;
  }

  const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
  const duration = calculateDuration(startDate, endDate);

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

      <AgreementActionButtons 
        onEdit={handleEdit}
        onDownloadPdf={handleDownloadPdf}
        onGenerateDocument={handleGenerateDocument}
        onDelete={handleDelete}
        isGeneratingPdf={isGeneratingPdf}
      />

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
            fetchPayments();
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
          <CardHeader>
            <CardTitle>Traffic Fines</CardTitle>
            <CardDescription>Violations during the rental period</CardDescription>
          </CardHeader>
          <CardContent>
            <AgreementTrafficFines agreementId={agreement.id} startDate={startDate} endDate={endDate} />
          </CardContent>
        </Card>}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete agreement {agreement.agreement_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentEntryDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen} 
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
