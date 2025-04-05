
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAgreements } from '@/hooks/use-agreements';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

const AgreementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18nTranslation();
  const { language } = useTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const isRefreshing = useRef(false);
  const refreshCount = useRef(0);
  const lastRefreshTime = useRef(0);
  
  // Use the useAgreements hook to fetch agreement data and access delete functionality
  const { 
    getAgreement, 
    deleteAgreement
  } = useAgreements();

  const [agreement, setAgreement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the useRentAmount hook to calculate rent and contract amount
  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  
  // Set page title and description directly from i18n translation files
  useEffect(() => {
    if (id) {
      console.log(`Setting page title and description for language: ${language}`);
      // Directly use the translated values from i18n
      const title = t('agreements.details');
      const description = t('agreements.viewDetails');
      
      console.log(`Page title from i18n: "${title}"`);
      console.log(`Page description from i18n: "${description}"`);
      
      setPageTitle(title);
      setPageDescription(description);
    }
  }, [t, id, language]); // When language changes, this will update

  // Fetch agreement data
  const fetchAgreementData = useCallback(async () => {
    if (!id) return;
    
    if (isRefreshing.current) {
      console.log("Agreement fetch already in progress, skipping");
      return;
    }
    
    const now = Date.now();
    if (now - lastRefreshTime.current < 1000) {
      console.log("Throttling agreement data refresh (too frequent)");
      return;
    }
    
    isRefreshing.current = true;
    lastRefreshTime.current = now;
    setIsLoading(true);
    
    try {
      console.log("Fetching agreement data for ID:", id);
      refreshCount.current += 1;
      const data = await getAgreement(id);
      if (data) {
        setAgreement(data);
      } else {
        setError(t('agreements.notFound'));
      }
    } catch (err) {
      console.error("Error fetching agreement:", err);
      setError(t('agreements.loadError'));
    } finally {
      setIsLoading(false);
      isRefreshing.current = false;
    }
  }, [id, getAgreement, t]);

  useEffect(() => {
    fetchAgreementData();
  }, [fetchAgreementData]);

  const handleDelete = useCallback(async (agreementId: string) => {
    try {
      await deleteAgreement.mutateAsync(agreementId);
      toast.success(t('agreements.deleteSuccess'));
      navigate('/agreements');
    } catch (err) {
      console.error("Error deleting agreement:", err);
      toast.error(t('agreements.deleteError'));
    }
  }, [deleteAgreement, navigate, t]);

  // Create debounced data refresh functions to prevent cascade refreshes
  const debouncedDataRefresh = useDebouncedCallback(() => {
    console.log("Running debounced agreement refresh");
    fetchAgreementData();
  }, 1000);
  
  const handlePaymentDeleted = useCallback(() => {
    debouncedDataRefresh();
  }, [debouncedDataRefresh]);

  const handleDataRefresh = useCallback(() => {
    debouncedDataRefresh();
  }, [debouncedDataRefresh]);

  if (error) {
    return (
      <PageContainer
        title={pageTitle || t('agreements.details')}
        description={pageDescription || t('agreements.viewDetails')}
        backLink="/agreements"
      >
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('agreements.notFound')}</AlertTitle>
          <AlertDescription>{t('agreements.notFoundDesc')}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/agreements')}>
          {t('agreements.returnToAgreements')}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={pageTitle || t('agreements.details')}
      description={pageDescription || t('agreements.viewDetails')}
      backLink="/agreements"
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <AgreementDetail
          agreement={agreement}
          onDelete={handleDelete}
          rentAmount={rentAmount}
          contractAmount={contractAmount}
          onPaymentDeleted={handlePaymentDeleted}
          onDataRefresh={handleDataRefresh}
        />
      )}
    </PageContainer>
  );
};

export default AgreementDetailPage;
