
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement, forceGeneratePaymentForAgreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { AlertTriangle, Calendar, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { supabase } from '@/lib/supabase';
import { manuallyRunPaymentMaintenance } from '@/lib/supabase';
import { getDateObject } from '@/lib/date-utils';
import { usePayments } from '@/hooks/use-payments';
import { fixAgreementPayments } from '@/lib/supabase';
import { ArabicTextService } from '@/utils/arabic-text-service';

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
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [isProcessingArabicText, setIsProcessingArabicText] = useState(false);

  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  
  const { payments, isLoadingPayments, fetchPayments } = usePayments(id || '', rentAmount);

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
    if (id && !isLoading && agreement && payments && payments.length > 0) {
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
  
  // Check DeepSeek AI service availability when component mounts
  useEffect(() => {
    const checkArabicService = async () => {
      await ArabicTextService.checkServiceAvailability();
    };
    
    checkArabicService();
  }, []);

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

  const handleGenerateDocument = async () => {
    if (!agreement) return;
    
    try {
      setIsProcessingArabicText(true);
      toast.info("Processing Arabic text with DeepSeek AI...");
      
      // Process all Arabic text fields through DeepSeek AI first
      const customerName = agreement.customers?.full_name || '';
      const vehicleMake = agreement.vehicles?.make || '';
      const vehicleModel = agreement.vehicles?.model || '';
      
      console.log(`Processing Arabic text for customer: "${customerName}"`);
      console.log(`Processing Arabic text for vehicle: "${vehicleMake} ${vehicleModel}"`);
      
      // Process customer name with DeepSeek AI
      const processedCustomerName = await ArabicTextService.processText(
        customerName, 
        'customer name'
      );
      
      if (processedCustomerName !== customerName) {
        console.log(`Customer name processed: "${customerName}" -> "${processedCustomerName}"`);
        if (agreement.customers) {
          agreement.customers.full_name = processedCustomerName;
        }
      }
      
      // Process vehicle details with DeepSeek AI
      const vehicleDetails = `${vehicleMake} ${vehicleModel}`;
      const processedVehicleDetails = await ArabicTextService.processText(
        vehicleDetails,
        'vehicle details'
      );
      
      if (processedVehicleDetails !== vehicleDetails && agreement.vehicles) {
        console.log(`Vehicle details processed: "${vehicleDetails}" -> "${processedVehicleDetails}"`);
        
        // Split processed text back into make and model
        const parts = processedVehicleDetails.split(' ');
        if (parts.length >= 2) {
          agreement.vehicles.make = parts[0];
          agreement.vehicles.model = parts.slice(1).join(' ');
        }
      }
      
      // Also process any notes or description fields
      if (agreement.notes) {
        const processedNotes = await ArabicTextService.processText(agreement.notes, 'agreement notes');
        if (processedNotes !== agreement.notes) {
          console.log(`Agreement notes processed successfully`);
          agreement.notes = processedNotes;
        }
      }
      
      setIsProcessingArabicText(false);
      setIsDocumentDialogOpen(true);
      
    } catch (error) {
      console.error('Error processing Arabic text:', error);
      toast.error('Failed to process Arabic text');
      setIsProcessingArabicText(false);
    }
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

  return (
    <PageContainer
      title="Agreement Details"
      description="View and manage rental agreement details"
      backLink="/agreements"
      actions={
        <>
          {agreement && agreement.status === AgreementStatus.ACTIVE && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGeneratePayment}
              disabled={isGeneratingPayment}
              className="gap-2 mr-2"
            >
              <Calendar className="h-4 w-4" />
              {isGeneratingPayment ? "Generating..." : "Generate Payment Schedule"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunMaintenanceJob}
            disabled={isRunningMaintenance}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            {isRunningMaintenance ? "Running..." : "Run Payment Maintenance"}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full md:col-span-2" />
          </div>
        </div>
      ) : agreement ? (
        <>
          <AgreementDetail 
            agreement={agreement}
            onDelete={handleDelete}
            rentAmount={rentAmount}
            contractAmount={contractAmount}
            onPaymentDeleted={refreshAgreementData}
            onDataRefresh={refreshAgreementData}
            onGenerateDocument={handleGenerateDocument}
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
        </>
      ) : (
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
      )}
    </PageContainer>
  );
};

export default AgreementDetailPage;
