import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { usePayments } from '@/hooks/use-payments';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { getDateObject } from '@/lib/date-utils';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { forceGeneratePaymentForAgreement, fixAgreementPayments, manuallyRunPaymentMaintenance } from '@/lib/payment-utils';
import { supabase } from '@/lib/supabase';
import AgreementHeader from '@/components/agreements/AgreementHeader';
import AgreementSummaryCard from '@/components/agreements/AgreementSummaryCard';
import AgreementTabs from '@/components/agreements/AgreementTabs';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  
  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  const {
    payments,
    isLoading: isLoadingPayments,
    fetchPayments,
    addPayment
  } = usePayments(id || '');

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
        toast.error("Agreement not found");
        navigate("/agreements");
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast.error('Failed to load agreement details');
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
  }, [id, isLoading, agreement, payments]);

  const handleDelete = async (agreementId: string) => {
    try {
      await deleteAgreement.mutateAsync(agreementId);
      toast.success("Agreement deleted successfully");
      navigate("/agreements");
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error("Failed to delete agreement");
    }
  };

  const refreshAgreementData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGenerateDocument = () => {
    setIsDocumentDialogOpen(true);
  };

  const handleGeneratePayment = async () => {
    if (!id || !agreement) return;
    setIsGeneratingPayment(true);
    try {
      const result = await forceGeneratePaymentForAgreement(supabase, id);
      if (result.success) {
        toast.success("Payment schedule generated successfully");
        refreshAgreementData();
      } else {
        toast.error(`Failed to generate payment: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error generating payment:", error);
      toast.error("Failed to generate payment schedule");
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleRunMaintenanceJob = async () => {
    if (!id) return;
    setIsRunningMaintenance(true);
    try {
      toast.info("Running payment maintenance check...");
      const result = await manuallyRunPaymentMaintenance();
      if (result.success) {
        toast.success(result.message || "Payment schedule maintenance completed");
        refreshAgreementData();
        fetchPayments();
      } else {
        toast.error(result.message || "Payment maintenance failed");
      }
    } catch (error) {
      console.error("Error running maintenance job:", error);
      toast.error("Failed to run maintenance job");
    } finally {
      setIsRunningMaintenance(false);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return "success";
      case 'pending':
        return "warning";
      case 'closed':
        return "outline";
      case 'cancelled':
        return "destructive";
      case 'expired':
        return "secondary";
      case 'draft':
        return "default";
      default:
        return "default";
    }
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

  if (isLoading) {
    return (
      <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements">
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full md:col-span-2" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!agreement) {
    return (
      <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements">
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
          <p className="text-muted-foreground mb-4">
            The agreement you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="outline" onClick={() => navigate("/agreements")}>
            Return to Agreements
          </Button>
        </div>
      </PageContainer>
    );
  }

  const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
  const createdDate = agreement.created_at instanceof Date ? agreement.created_at : new Date(agreement.created_at || new Date());

  return (
    <PageContainer 
      title="Agreement Details" 
      description="View and manage rental agreement details" 
      backLink="/agreements"
    >
      <AgreementHeader
        agreementNumber={agreement.agreement_number}
        status={agreement.status}
        onDelete={() => handleDelete(agreement.id)}
      />

      <AgreementSummaryCard
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        depositAmount={agreement.deposit_amount}
        startDate={startDate}
        endDate={endDate}
        createdAt={createdDate}
      />

      <AgreementTabs
        agreement={agreement}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        payments={payments}
        isLoadingPayments={isLoadingPayments}
        rentAmount={rentAmount}
        onPaymentDeleted={refreshAgreementData}
        fetchPayments={fetchPayments}
      />
      
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <InvoiceGenerator 
            recordType="agreement" 
            recordId={agreement.id} 
            onClose={() => setIsDocumentDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handlePaymentSubmit}
        defaultAmount={rentAmount || 0}
        title="Record Payment"
        description="Enter payment details to record a new payment"
      />
    </PageContainer>
  );
};

export default AgreementDetailPage;
