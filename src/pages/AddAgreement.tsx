
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
      
      toast.success(t('agreements.createSuccess', 'Agreement created successfully'));
      navigate('/agreements');
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast.error(t('agreements.createError', 'Failed to create agreement'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title={t('agreements.add', 'Add Agreement')}
      description={t('agreements.description', 'Manage rental agreements')}
      backLink="/agreements"
      notification={t('agreements.usingStandardTemplateDesc', 'Using standard agreement template')}
    >
      <AgreementFormWithVehicleCheck
        onSubmit={handleCreateAgreement}
        isSubmitting={isSubmitting}
      />
    </PageContainer>
  );
};

export default AddAgreement;
