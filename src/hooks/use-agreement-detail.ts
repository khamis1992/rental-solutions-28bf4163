
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAgreement } from '@/hooks/use-agreement';
import { usePayments } from '@/hooks/use-payments';
import { usePayment } from '@/hooks/use-payment';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { generateAgreementReport } from '@/utils/agreement-report-utils';
import { fixAgreementPayments } from '@/lib/supabase';

export function useAgreementDetail(id?: string) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [hasRunHistoricalUpdate, setHasRunHistoricalUpdate] = useState(false);
  const [isUpdatingHistoricalPayments, setIsUpdatingHistoricalPayments] = useState(false);
  
  // Agreement hooks
  const {
    agreement,
    isLoading,
    error,
    deleteAgreement
  } = useAgreement(id);
  
  // Get rent amount calculation
  const {
    rentAmount,
    contractAmount
  } = useRentAmount(agreement, id);
  
  // Use payment hooks
  const {
    payments,
    isLoading: isLoadingPayments,
    updatePayment,
    deletePayment,
    addPayment,
    fetchPayments
  } = usePayments(id || '');
  
  const { 
    updateHistoricalStatuses,
    generatePaymentSchedule,
    runPaymentMaintenance,
    isPending: paymentIsPending
  } = usePayment(id);

  // Monitor for duplicate payments and fix them if needed
  useEffect(() => {
    if (id && !isLoading && agreement && Array.isArray(payments) && payments.length > 0) {
      const paymentDates = payments.filter(p => p.original_due_date).map(p => {
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
  }, [id, isLoading, agreement, payments, fetchPayments]);
  
  // Effect to automatically update historical payment statuses when payments tab is opened
  useEffect(() => {
    const runHistoricalUpdate = async () => {
      if (activeTab === "payments" && id && !hasRunHistoricalUpdate && !isUpdatingHistoricalPayments) {
        setIsUpdatingHistoricalPayments(true);
        toast.info("Updating historical payment records to completed status...");
        
        try {
          const result = await updateHistoricalStatuses();
          toast.success(`${result.updatedCount} historical payment records updated to completed status`);
          fetchPayments();
        } catch (error) {
          console.error("Error updating historical payments:", error);
          toast.error("Failed to update historical payment statuses");
        } finally {
          setIsUpdatingHistoricalPayments(false);
          setHasRunHistoricalUpdate(true);
        }
      }
    };
    
    runHistoricalUpdate();
  }, [activeTab, id, hasRunHistoricalUpdate, updateHistoricalStatuses, fetchPayments, isUpdatingHistoricalPayments]);

  const refreshAgreementData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGenerateDocument = () => {
    setIsDocumentDialogOpen(true);
  };

  const handleGeneratePayment = async () => {
    if (!id || !agreement) return;
    
    try {
      await generatePaymentSchedule();
      refreshAgreementData();
    } catch (error) {
      console.error("Error generating payment:", error);
    }
  };

  const handleRunMaintenanceJob = async () => {
    try {
      toast.info("Running payment maintenance check...");
      await runPaymentMaintenance();
      refreshAgreementData();
      fetchPayments();
    } catch (error) {
      console.error("Error running maintenance job:", error);
      toast.error("Failed to run maintenance job");
    }
  };

  const handleGenerateReport = async () => {
    if (!agreement) return;
    
    try {
      const doc = generateAgreementReport(agreement, rentAmount, contractAmount, payments);
      doc.save(`agreement-report-${agreement.agreement_number}.pdf`);
      toast.success('Agreement report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate agreement report');
    }
  };

  const calculateProgress = () => {
    if (!agreement || !agreement.start_date || !agreement.end_date) return 0;
    const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
    const today = new Date();
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    return Math.min(Math.floor(elapsed / totalDuration * 100), 100);
  };

  const handlePaymentSubmit = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string,
    includeLatePaymentFee?: boolean
  ) => {
    if (!id) return;
    
    try {
      const newPayment = {
        amount,
        payment_date: paymentDate.toISOString(),
        lease_id: id,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes,
        status: 'completed',
        description: notes || 'Payment'
      };
      
      await addPayment(newPayment);
      toast.success('Payment recorded successfully');
      fetchPayments();
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!id) return;
    
    try {
      await deletePayment(paymentId);
      fetchPayments();
      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  return {
    // State
    agreement,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    isDocumentDialogOpen,
    setIsDocumentDialogOpen,
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    isUpdatingHistoricalPayments,
    
    // Data
    rentAmount,
    contractAmount,
    payments,
    isLoadingPayments,
    paymentIsPending,
    
    // Functions
    deleteAgreement,
    calculateProgress,
    handleGenerateDocument,
    handleGeneratePayment,
    handleRunMaintenanceJob,
    handleGenerateReport,
    handlePaymentSubmit,
    handleDeletePayment,
    refreshAgreementData,
    fetchPayments,
    updatePayment,
    addPayment
  };
}
