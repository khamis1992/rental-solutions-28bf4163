
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const AgreementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18nTranslation();
  const { translateText } = useTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  
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

  const handleError = async (message: string) => {
    const translatedMessage = await translateText(message);
    setError(translatedMessage);
  };

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
      {id ? (
        <AgreementDetail
          agreement={null}
          onDelete={() => {}}
          rentAmount={null}
          contractAmount={null}
          onPaymentDeleted={() => {}}
          onDataRefresh={() => {}}
        />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('agreements.loadError')}</AlertTitle>
        </Alert>
      )}
    </PageContainer>
  );
};

export default AgreementDetailPage;
