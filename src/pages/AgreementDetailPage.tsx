
import React from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import { AgreementDetailHeader } from '@/components/agreements/detail/AgreementDetailHeader';
import { AgreementOverviewCard } from '@/components/agreements/detail/AgreementOverviewCard';
import { AgreementPageActions } from '@/components/agreements/detail/AgreementPageActions';
import { AgreementTabs } from '@/components/agreements/detail/AgreementTabs';
import { AgreementLoading } from '@/components/agreements/detail/AgreementLoading';
import { AgreementError } from '@/components/agreements/detail/AgreementError';
import { AgreementNotFound } from '@/components/agreements/detail/AgreementNotFound';
import { useAgreementDetail } from '@/hooks/use-agreement-detail';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // Use our custom hook for agreement details
  const {
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
    rentAmount,
    contractAmount,
    payments,
    isLoadingPayments,
    paymentIsPending,
    deleteAgreement,
    calculateProgress,
    handleGenerateDocument,
    handleGeneratePayment,
    handleRunMaintenanceJob,
    handleGenerateReport,
    handlePaymentSubmit,
    handleDeletePayment,
    fetchPayments,
    updatePayment,
    addPayment
  } = useAgreementDetail(id);

  // Render loading state
  if (isLoading) {
    return (
      <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements">
        <AgreementLoading />
      </PageContainer>
    );
  }

  // Render error state if agreement couldn't be loaded
  if (error) {
    return (
      <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements">
        <AgreementError error={error} />
      </PageContainer>
    );
  }

  // Render not found state if agreement doesn't exist
  if (!agreement) {
    return (
      <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements">
        <AgreementNotFound />
      </PageContainer>
    );
  }

  // Main component rendering with agreement data
  return (
    <PageContainer 
      title="Agreement Details" 
      description="View and manage rental agreement details" 
      backLink="/agreements" 
      actions={
        <AgreementPageActions
          isActive={agreement.status === AgreementStatus.ACTIVE}
          onGeneratePayment={handleGeneratePayment}
          onGenerateReport={handleGenerateReport}
          onRunMaintenance={handleRunMaintenanceJob}
          paymentIsPending={paymentIsPending}
        />
      }
    >
      <AgreementDetailHeader 
        agreementNumber={agreement.agreement_number}
        status={agreement.status}
        id={agreement.id}
        onDelete={deleteAgreement}
      />

      <AgreementOverviewCard 
        agreement={agreement}
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        calculateProgress={calculateProgress}
      />

      <AgreementTabs
        agreement={agreement}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        payments={payments}
        isLoadingPayments={isLoadingPayments}
        rentAmount={rentAmount}
        contractAmount={contractAmount}
        onPaymentDeleted={handleDeletePayment}
        fetchPayments={fetchPayments}
        updatePayment={updatePayment}
        addPayment={addPayment}
        isUpdatingHistoricalPayments={isUpdatingHistoricalPayments}
      />
      
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <InvoiceGenerator recordType="agreement" recordId={agreement.id} onClose={() => setIsDocumentDialogOpen(false)} />
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
