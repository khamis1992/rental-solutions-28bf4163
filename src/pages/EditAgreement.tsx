import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AgreementFormWithVehicleCheck from '@/components/agreements/AgreementFormWithVehicleCheck';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import type { Agreement } from '@/lib/validation-schemas/agreement';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

const EditAgreement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAgreement, updateAgreement } = useAgreements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreementData, setAgreementData] = useState<Agreement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18nTranslation();
  const { translateText } = useTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');

  useEffect(() => {
    const loadTranslations = async () => {
      const title = await translateText(t('agreements.edit'));
      const description = await translateText(t('agreements.description'));
      
      setPageTitle(title);
      setPageDescription(description);
    };
    
    loadTranslations();
  }, [t, translateText]);
  
  useEffect(() => {
    const fetchAgreement = async () => {
      if (!id) return;
      
      try {
        const agreement = await getAgreement(id);
        if (agreement) {
          const processedAgreement: Agreement = {
            ...agreement,
            start_date: agreement.start_date ? new Date(agreement.start_date) : new Date(),
            end_date: agreement.end_date ? new Date(agreement.end_date) : new Date(),
            created_at: agreement.created_at ? new Date(agreement.created_at) : undefined,
            updated_at: agreement.updated_at ? new Date(agreement.updated_at) : undefined,
            status: (agreement.status as "active" | "pending" | "draft" | "expired" | "cancelled" | "closed") || "draft"
          };
          setAgreementData(processedAgreement);
        } else {
          const translatedError = await translateText(t('agreements.notFound'));
          setError(translatedError);
        }
      } catch (err) {
        console.error('Error fetching agreement:', err);
        const translatedError = await translateText(t('agreements.loadError'));
        setError(translatedError);
      }
    };
    
    fetchAgreement();
  }, [id, getAgreement, t, translateText]);

  const handleUpdateAgreement = async (data: Agreement) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      
      const formattedData = {
        ...data,
        id,
        start_date: data.start_date instanceof Date 
          ? data.start_date.toISOString() 
          : data.start_date,
        end_date: data.end_date instanceof Date 
          ? data.end_date.toISOString() 
          : data.end_date
      };
      
      await updateAgreement.mutateAsync({
        id,
        data: formattedData
      });
      
      const successMessage = await translateText(t('common.success'));
      toast.success(successMessage);
      
      navigate(`/agreements/${id}`);
    } catch (err) {
      console.error('Error updating agreement:', err);
      
      const errorMessage = await translateText(t('common.error'));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialData = useMemo(() => {
    if (!agreementData) return {};
    const data: Record<string, any> = {};
    
    if (agreementData && typeof agreementData === 'object') {
      Object.entries(agreementData).forEach(([key, value]) => {
        data[key] = value;
      });

      if ('start_date' in agreementData) {
        data.start_date = agreementData.start_date ? new Date(agreementData.start_date) : null;
      }
      if ('end_date' in agreementData) {
        data.end_date = agreementData.end_date ? new Date(agreementData.end_date) : null;
      }
      if ('created_at' in agreementData) {
        data.created_at = agreementData.created_at ? new Date(agreementData.created_at) : null;
      }
      if ('updated_at' in agreementData) {
        data.updated_at = agreementData.updated_at ? new Date(agreementData.updated_at) : null;
      }
      if ('status' in agreementData) {
        data.status = agreementData.status || 'draft';
      }
    }
    
    return data;
  }, [agreementData]);

  if (error) {
    return (
      <PageContainer
        title={pageTitle || t('agreements.edit')}
        description={pageDescription || t('agreements.description')}
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
      title={pageTitle || t('agreements.edit')}
      description={pageDescription || t('agreements.description')}
      backLink={id ? `/agreements/${id}` : '/agreements'}
    >
      {agreementData ? (
        <AgreementFormWithVehicleCheck
          onSubmit={handleUpdateAgreement}
          isSubmitting={isSubmitting}
          initialData={initialData}
        />
      ) : (
        <div className="flex items-center justify-center p-6">
          <div className="animate-pulse">{t('common.loading')}</div>
        </div>
      )}
    </PageContainer>
  );
};

export default EditAgreement;
