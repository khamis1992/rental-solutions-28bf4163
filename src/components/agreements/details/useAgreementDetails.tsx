
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAgreements } from '@/hooks/use-agreements';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { usePayments } from '@/hooks/use-payments';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { fixAgreementPayments } from '@/lib/supabase';
import { getDateObject } from '@/lib/date-utils';

export function useAgreementDetails(id?: string) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { rentAmount } = useRentAmount(agreement, id);
  const { payments, isLoading: isLoadingPayments, fetchPayments } = usePayments(id);

  const fetchAgreementData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await getAgreement(id);
      
      if (data) {
        const adaptedAgreement = adaptSimpleToFullAgreement(data);
        
        if (adaptedAgreement.start_date) {
          const safeDate = getDateObject(adaptedAgreement.start_date);
          adaptedAgreement.start_date = safeDate || new Date();
        }
        
        if (adaptedAgreement.end_date) {
          const safeDate = getDateObject(adaptedAgreement.end_date);
          adaptedAgreement.end_date = safeDate || new Date();
        }
        
        if (adaptedAgreement.created_at) {
          const safeDate = getDateObject(adaptedAgreement.created_at);
          adaptedAgreement.created_at = safeDate;
        }
        
        if (adaptedAgreement.updated_at) {
          const safeDate = getDateObject(adaptedAgreement.updated_at);
          adaptedAgreement.updated_at = safeDate;
        }
        
        setAgreement(adaptedAgreement);
        fetchPayments();
      } else {
        toast({
          title: "Error",
          description: "Agreement not found",
          variant: "destructive",
        });
        navigate("/agreements");
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast({
        title: "Error",
        description: "Failed to load agreement details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  };

  useEffect(() => {
    if (id && (!hasAttemptedFetch || refreshTrigger > 0)) {
      fetchAgreementData();
    }
  }, [id, refreshTrigger]);

  useEffect(() => {
    if (id && !isLoading && agreement && Array.isArray(payments) && payments.length > 0) {
      const paymentDates = payments
        .filter(p => p.original_due_date)
        .map(p => {
          const date = new Date(p.original_due_date as string);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });
      
      const monthCounts = paymentDates.reduce((acc, date) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const hasDuplicates = Object.values(monthCounts).some(count => count > 1);
      
      if (hasDuplicates) {
        console.log("Detected duplicate payments - will fix automatically");
        fixAgreementPayments(id).then(() => {
          fetchPayments();
        });
      }
    }
  }, [id, isLoading, agreement, payments]);

  const handlePaymentSubmit = async (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    targetPaymentId?: string
  ) => {
    try {
      if (!agreement) return;
      
      toast({
        title: "Success",
        description: "Payment recorded successfully",
        variant: "default",
      });
      
      setIsPaymentDialogOpen(false);
      fetchAgreementData();
      fetchPayments();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  return {
    agreement,
    isLoading,
    rentAmount,
    isGeneratingPayment,
    setIsGeneratingPayment,
    isRunningMaintenance,
    setIsRunningMaintenance,
    isDocumentDialogOpen,
    setIsDocumentDialogOpen,
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    handlePaymentSubmit,
    navigate,
  };
}
