
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

const AgreementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18nTranslation();
  const { translateText } = useTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const isRefreshing = useRef(false);
  const refreshDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Use the useAgreements hook to fetch agreement data and access delete functionality
  const { 
    getAgreement, 
    deleteAgreement
  } = useAgreements();

  const [agreement, setAgreement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the useRentAmount hook to calculate rent and contract amount
  const { rentAmount, contractAmount } = useRentAmount(agreement, id);
  
  // Pre-translate the page title and description
  useEffect(() => {
    const loadTranslations = async () => {
      if (id) {
        const title = await translateText(t('agreements.details'));
        const description = await translateText(t('agreements.viewDetails'));
        
        setPageTitle(title);
        setPageDescription(description);
      }
    };
    
    loadTranslations();
  }, [t, translateText, id]);

  // Fetch agreement data
  const fetchAgreementData = useCallback(async () => {
    if (!id) return;
    
    if (isRefreshing.current) {
      console.log("Agreement fetch already in progress, skipping");
      return;
    }
    
    isRefreshing.current = true;
    setIsLoading(true);
    
    try {
      console.log("Fetching agreement data for ID:", id);
      const data = await getAgreement(id);
      if (data) {
        setAgreement(data);
      } else {
        const message = t('agreements.notFound');
        await handleError(message);
      }
    } catch (err) {
      console.error("Error fetching agreement:", err);
      const message = t('agreements.loadError');
      await handleError(message);
    } finally {
      setIsLoading(false);
      isRefreshing.current = false;
    }
  }, [id, getAgreement, t]);

  useEffect(() => {
    fetchAgreementData();
  }, [fetchAgreementData]);

  const handleError = async (message: string) => {
    const translatedMessage = await translateText(message);
    setError(translatedMessage);
  };

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

  // Debounce data refresh to prevent excessive refreshes
  const handlePaymentDeleted = useCallback(() => {
    if (refreshDebounceTimer.current) {
      clearTimeout(refreshDebounceTimer.current);
    }
    
    refreshDebounceTimer.current = setTimeout(() => {
      console.log("Refreshing agreement data after payment change (debounced)");
      if (!isRefreshing.current) {
        fetchAgreementData();
      }
      refreshDebounceTimer.current = null;
    }, 800);
  }, [fetchAgreementData]);

  const handleDataRefresh = useCallback(() => {
    if (refreshDebounceTimer.current) {
      clearTimeout(refreshDebounceTimer.current);
    }
    
    refreshDebounceTimer.current = setTimeout(() => {
      console.log("Refreshing agreement data from manual trigger (debounced)");
      if (!isRefreshing.current) {
        fetchAgreementData();
      }
      refreshDebounceTimer.current = null;
    }, 800);
  }, [fetchAgreementData]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshDebounceTimer.current) {
        clearTimeout(refreshDebounceTimer.current);
      }
    };
  }, []);

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
