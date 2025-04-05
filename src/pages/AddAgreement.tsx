
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AgreementFormWithVehicleCheck from '@/components/agreements/AgreementFormWithVehicleCheck';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import type { Agreement } from '@/lib/validation-schemas/agreement';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext'; 

const AddAgreement = () => {
  const navigate = useNavigate();
  const { createAgreement } = useAgreements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useI18nTranslation();
  const { isRTL, translateText } = useTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');

  // Pre-translate the page title, description, and template message to avoid flickering
  useEffect(() => {
    const loadTranslations = async () => {
      const title = await translateText(t('agreements.add'));
      const description = await translateText(t('agreements.description'));
      const standardTemplateMessage = await translateText(t('agreements.usingStandardTemplateDesc'));
      
      setPageTitle(title);
      setPageDescription(description);
      setTemplateMessage(standardTemplateMessage);
    };
    
    loadTranslations();
  }, [t, translateText, isRTL]);

  const handleCreateAgreement = async (agreementData: Agreement) => {
    try {
      setIsSubmitting(true);
      
      // Convert date objects to ISO strings for database storage
      const formattedData = {
        ...agreementData,
        start_date: agreementData.start_date instanceof Date 
          ? agreementData.start_date.toISOString() 
          : agreementData.start_date,
        end_date: agreementData.end_date instanceof Date 
          ? agreementData.end_date.toISOString() 
          : agreementData.end_date
      };
      
      await createAgreement.mutateAsync(formattedData);
      
      // Use translated success message
      const successMessage = await translateText(t('agreements.createSuccess'));
      toast.success(successMessage);
      
      navigate('/agreements');
    } catch (error) {
      console.error('Error creating agreement:', error);
      
      // Use translated error message
      const errorMessage = await translateText(t('agreements.createError'));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title={pageTitle || t('agreements.add')}
      description={pageDescription || t('agreements.description')}
      backLink="/agreements"
      notification={templateMessage || t('agreements.usingStandardTemplateDesc')}
    >
      <AgreementFormWithVehicleCheck
        onSubmit={handleCreateAgreement}
        isSubmitting={isSubmitting}
      />
    </PageContainer>
  );
};

export default AddAgreement;
