import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAgreements } from '@/hooks/use-agreements';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { asDbId, AgreementId, LeaseId } from '@/types/database-types';
import { usePayments } from '@/hooks/use-payments';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { differenceInMonths } from 'date-fns';
import { useDateUtils } from '@/hooks/use-date-utils';
import { PaymentSubmitParams } from '@/components/agreements/AgreementDetail.types';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';
import { ExtendedPayment } from '@/components/agreements/PaymentHistory.types';

export const useAgreementDetail = (
  agreementId: string | undefined,
  onDelete?: (id: string) => void,
  onDataRefresh?: () => void,
  onGenerateDocument?: () => void
) => {
  const navigate = useNavigate();
  const { getAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lateFeeDetails, setLateFeeDetails] = useState<{
    amount: number;
    daysLate: number;
  } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { calculateDuration } = useDateUtils();

  const {
    payments = [],
    isLoading: paymentsLoading,
    fetchPayments,
    updatePayment,
    addPayment
  } = usePayments(agreement?.id);
  
  const {
    handleSpecialAgreementPayments
  } = usePaymentGeneration(agreement, agreement?.id);

  const handleDeleteAgreement = useCallback(() => {
    if (agreement && onDelete) {
      const typedId = asDbId<LeaseId>(agreement.id);
      onDelete(typedId);
    }
  }, [agreement, onDelete]);

  const confirmDelete = useCallback(() => {
    if (agreement && onDelete) {
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

  const handlePaymentSubmit = useCallback(async ({
    amount,
    paymentDate,
    notes,
    paymentMethod,
    referenceNumber,
    includeLatePaymentFee,
    isPartialPayment
  }: PaymentSubmitParams) => {
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
          if (onDataRefresh) onDataRefresh();
          fetchPayments();
          toast.success("Payment recorded successfully");
        }
      } catch (error) {
        console.error("Error recording payment:", error);
        toast.error("Failed to record payment");
      }
    }
  }, [agreement, handleSpecialAgreementPayments, onDataRefresh, fetchPayments]);

  const handlePaymentUpdate = useCallback(async (updatedPayment: Partial<ExtendedPayment>): Promise<void> => {
    if (!agreement?.id) return;
    
    try {
      await updatePayment({
        id: updatedPayment.id!,
        data: updatedPayment
      });
      if (onDataRefresh) onDataRefresh();
      fetchPayments();
      toast.success("Payment updated successfully");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    }
  }, [agreement?.id, updatePayment, onDataRefresh, fetchPayments]);

  const addPayment = async (params: PaymentSubmitParams) => {
    try {
      const { 
        amount, 
        paymentDate, 
        notes, 
        paymentMethod, 
        referenceNumber, 
        includeLatePaymentFee, 
        isPartialPayment,
        targetPaymentId
      } = params;
      
      console.log("Adding payment:", params);
      
      fetchPayments();
      toast.success("Payment added successfully");
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    }
  };

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

  const fetchAgreementData = useCallback(async () => {
    if (!agreementId) return;
    
    try {
      setIsLoading(true);
      const data = await getAgreement(agreementId);
      if (data) {
        const parsedStartDate = data.start_date ? new Date(data.start_date) : null;
        const parsedEndDate = data.end_date ? new Date(data.end_date) : null;
        const parsedCreatedAt = data.created_at ? new Date(data.created_at) : null;
        
        setAgreement({
          ...data,
          start_date: parsedStartDate,
          end_date: parsedEndDate,
          created_at: parsedCreatedAt
        });
        
        fetchPayments();
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast.error('Failed to load agreement details');
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  }, [agreementId, getAgreement, fetchPayments]);

  useEffect(() => {
    if (agreementId && (!hasAttemptedFetch || refreshTrigger > 0)) {
      fetchAgreementData();
    }
  }, [agreementId, refreshTrigger, hasAttemptedFetch, fetchAgreementData]);

  const agreementDuration = useCallback(() => {
    if (!agreement?.start_date || !agreement?.end_date) return 0;
    
    const startDate = agreement.start_date instanceof Date 
      ? agreement.start_date 
      : new Date(agreement.start_date);
      
    const endDate = agreement.end_date instanceof Date 
      ? agreement.end_date 
      : new Date(agreement.end_date);
      
    return calculateDuration(startDate, endDate);
  }, [agreement, calculateDuration]);

  const rentAmount = agreement?.rent_amount || 0;
  const contractAmount = rentAmount * agreementDuration();

  return {
    agreement,
    isLoading,
    payments,
    paymentsLoading,
    isDeleteDialogOpen,
    isPaymentDialogOpen,
    isGeneratingPdf,
    lateFeeDetails,
    selectedPayment,
    rentAmount,
    contractAmount,
    handleDeleteAgreement,
    confirmDelete,
    handlePrint,
    handleEdit,
    handleDownloadPdf,
    handleGenerateDocument,
    handlePaymentSubmit,
    handlePaymentUpdate,
    setIsDeleteDialogOpen,
    setIsPaymentDialogOpen,
    setSelectedPayment,
    refreshData: () => setRefreshTrigger(prev => prev + 1),
    agreementDuration,
    addPayment
  };
};
