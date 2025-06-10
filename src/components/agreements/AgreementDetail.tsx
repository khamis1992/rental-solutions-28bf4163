
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { differenceInMonths } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { AgreementDeletionDialog } from './dialogs/AgreementDeletionDialog';
import { Payment } from '@/types/payment.types';
import { supabase } from '@/lib/supabase';
import { usePaymentManagement } from '@/hooks/payment/use-payment-management';
import { useLoadingStates } from '@/hooks/payment/use-loading-states';
import { useDialogVisibility } from '@/utils/api/dialog-utils';
import { usePaymentCalculation } from '@/hooks/payment/use-payment-calculation';
import { PaymentSyncButton } from './PaymentSyncButton';
import { PaymentDebugPanel } from '@/components/debug/PaymentDebugPanel';
import { AgreementOverviewCard } from './redesigned/tabs/AgreementOverviewCard';
import { PaymentManagementCard } from './redesigned/tabs/PaymentManagementCard';
import { DocumentsCard } from './redesigned/tabs/DocumentsCard';
import { SettingsCard } from './redesigned/tabs/SettingsCard';
import { FileText, CreditCard, FileImage, Settings, Bug } from 'lucide-react';

interface AgreementDetailProps {
  onDelete: (id: string) => void;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
  onGenerateDocument?: () => Promise<void>;
}

export function AgreementDetail({
  onDelete,
  onPaymentDeleted,
  onDataRefresh,
  onGenerateDocument
}: AgreementDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use the dialog management hook
  const { openDialog, closeDialog, isDialogVisible } = useDialogVisibility({
    delete: false,
    payment: false
  });
  
  // Use our loading states hook for PDF generation
  const { loadingStates, setLoading, setIdle } = useLoadingStates({
    generatingPdf: false
  });

  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Fetch agreement data
  const { data: agreement, isLoading: isLoadingAgreement } = useQuery({
    queryKey: ['agreement', id],
    queryFn: async () => {
      if (!id) throw new Error('Agreement ID is required');
      
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers (
            id,
            full_name,
            email,
            phone_number,
            driver_license,
            nationality
          ),
          vehicles (
            id,
            make,
            model,
            year,
            license_plate,
            vin,
            color
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Use payment management hook
  const {
    payments,
    isLoading: isLoadingPayments,
    updatePayment: updatePaymentMutation,
    addPayment: addPaymentMutation,
    deletePayment: deletePaymentMutation,
    refetch: fetchPayments
  } = usePaymentManagement(agreement?.id);
  
  // Helper function to safely convert date string to Date object
  const ensureDate = (dateValue: string | Date): Date => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    return dateValue;
  };

  // Use payment calculation hook with correct parameters
  const paymentMetrics = usePaymentCalculation(
    payments, 
    agreement?.total_amount,
    agreement?.start_date ? ensureDate(agreement.start_date) : null,
    agreement?.end_date ? ensureDate(agreement.end_date) : null
  );

  // Handle agreement deletion
  const confirmDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
      closeDialog('delete');
    }
  }, [agreement, onDelete, closeDialog]);

  // Edit agreement
  const handleEdit = useCallback(() => {
    if (agreement) {
      navigate(`/agreements/edit/${agreement.id}`);
    }
  }, [agreement, navigate]);

  // Download PDF
  const handleDownloadPdf = useCallback(async () => {
    if (agreement) {
      try {
        setLoading('generatingPdf');
        toast.info("Preparing agreement PDF document...");
        
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

  // Update payment
  const handleUpdatePayment = useCallback(async (payment: Partial<Payment>) => {
    if (payment.id) {
      try {
        const success = await updatePaymentMutation.mutateAsync({ id: payment.id, data: payment });
        if (success) {
          onDataRefresh();
        }
        return !!success;
      } catch (error) {
        console.error('Failed to update payment:', error);
        return false;
      }
    }
    return false;
  }, [updatePaymentMutation, onDataRefresh]);

  // Delete payment
  const handleDeletePayment = useCallback(async (paymentId: string) => {
    try {
      await deletePaymentMutation.mutateAsync(paymentId);
      onPaymentDeleted();
    } catch (error) {
      console.error('Failed to delete payment:', error);
    }
  }, [deletePaymentMutation, onPaymentDeleted]);
  
  // Fix the type issue by making this function return Promise<void>
  const handleGenerateDocument = useCallback(async (): Promise<void> => {
    if (onGenerateDocument) {
      await onGenerateDocument();
    } else {
      // If no onGenerateDocument prop provided, use the default PDF generation
      await handleDownloadPdf();
    }
  }, [onGenerateDocument, handleDownloadPdf]);

  if (isLoadingAgreement) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading agreement details...
        </div>
      </Card>
    );
  }

  if (!agreement) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No agreement found
        </div>
      </Card>
    );
  }

  // Calculate duration for details card
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
      {/* Header with Agreement Info and Debug Toggle */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Agreement Details</h1>
            <Badge variant="outline" className="px-3 py-1">
              {agreement.agreement_number || 'No Number'}
            </Badge>
            <Badge 
              variant={agreement.status === 'active' ? 'default' : 'secondary'}
              className="px-3 py-1"
            >
              {agreement.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage agreement information, payments, and related documents
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-xs"
          >
            <Bug className="h-4 w-4 mr-1" />
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

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <AgreementOverviewCard
            agreement={agreement}
            duration={duration}
            rentAmount={agreement.rent_amount}
            contractAmount={agreement.total_amount}
          />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6 mt-6">
          <PaymentManagementCard
            agreement={agreement}
            payments={payments}
            isLoading={isLoadingPayments}
            rentAmount={agreement.rent_amount}
            contractAmount={agreement.total_amount}
            paymentMetrics={paymentMetrics}
            onPaymentDeleted={handleDeletePayment}
            onPaymentUpdated={handleUpdatePayment}
            onRecordPayment={handleRecordPayment}
            fetchPayments={fetchPayments}
            getDateString={getDateString}
          />
        </TabsContent>

        {/* Documents & Legal Tab */}
        <TabsContent value="documents" className="space-y-6 mt-6">
          <DocumentsCard
            agreement={agreement}
            onEdit={handleEdit}
            onDownloadPdf={handleDownloadPdf}
            onGenerateDocument={handleGenerateDocument}
            onDelete={() => openDialog('delete')}
            isGeneratingPdf={loadingStates.generatingPdf}
            getDateString={getDateString}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <SettingsCard
            agreement={agreement}
            onEdit={handleEdit}
            onDelete={() => openDialog('delete')}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AgreementDeletionDialog
        open={isDialogVisible('delete')}
        onOpenChange={() => closeDialog('delete')}
        agreementId={agreement.id}
        agreementNumber={agreement.agreement_number || 'Unknown'}
        onConfirmDelete={confirmDelete}
      />

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
              status: 'paid'
            };
            await handleRecordPayment(payment);
            closeDialog('payment');
            return true;
          }}
          defaultAmount={agreement.rent_amount || 0}
          title="Record Payment"
          description="Add a new payment to this agreement"
          leaseId={agreement.id}
          rentAmount={agreement.rent_amount}
          selectedPayment={null}
        />
      )}
    </div>
  );
}
