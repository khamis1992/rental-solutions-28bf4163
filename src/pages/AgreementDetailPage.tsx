
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { supabase } from '@/lib/supabase';
import { manuallyRunPaymentMaintenance } from '@/lib/supabase';
import { getDateObject } from '@/lib/date-utils';
import { usePayments } from '@/hooks/use-payments';
import { fixAgreementPayments } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { t } = useTranslation();

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
        toast.error(t('agreements.notFound'));
        navigate("/agreements");
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast.error(t('agreements.loadError'));
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

  const handleDelete = async (agreementId: string) => {
    try {
      await deleteAgreement.mutateAsync(agreementId);
      toast.success(t('agreements.deleteSuccess'));
      navigate("/agreements");
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error(t('agreements.deleteError'));
    }
  };

  const handleDeleteConfirmation = () => {
    if (!id) return;
    setDeleteDialogOpen(true);
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
        toast.success(t('agreements.paymentScheduleGenerated'));
        refreshAgreementData();
      } else {
        toast.error(`${t('agreements.paymentScheduleError')}: ${result.message || t('agreements.unknownError')}`);
      }
    } catch (error) {
      console.error("Error generating payment:", error);
      toast.error(t('agreements.paymentScheduleError'));
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleRunMaintenanceJob = async () => {
    if (!id) return;
    
    setIsRunningMaintenance(true);
    try {
      toast.info(t('agreements.runningMaintenanceCheck'));
      const result = await manuallyRunPaymentMaintenance();
      
      if (result.success) {
        toast.success(result.message || t('agreements.maintenanceCompleted'));
        refreshAgreementData();
        fetchPayments();
      } else {
        toast.error(result.message || t('agreements.maintenanceFailed'));
      }
    } catch (error) {
      console.error("Error running maintenance job:", error);
      toast.error(t('agreements.maintenanceFailed'));
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  return (
    <PageContainer
      title={t('agreements.details')}
      description={t('agreements.viewDetails')}
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
              {isGeneratingPayment ? t('common.loading') : t('agreements.generatePaymentSchedule')}
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
            {isRunningMaintenance ? t('common.loading') : t('agreements.runPaymentMaintenance')}
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
            onDelete={handleDeleteConfirmation}
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

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('agreements.delete')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('agreements.deleteConfirmation', { number: agreement.agreement_number })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(agreement.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('agreements.notFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('agreements.notFoundDesc')}
          </p>
          <Button variant="outline" onClick={() => navigate("/agreements")}>
            {t('agreements.returnToAgreements')}
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default AgreementDetailPage;
