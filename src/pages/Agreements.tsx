
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';

const Agreements = () => {
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  const { isRTL, translateText } = useTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [addButtonText, setAddButtonText] = useState('');

  // Pre-translate the page title, description, and button text to avoid flickering
  useEffect(() => {
    const loadTranslations = async () => {
      const title = await translateText(t('agreements.title'));
      const description = await translateText(t('agreements.description'));
      const buttonText = await translateText(t('agreements.newAgreement'));
      
      setPageTitle(title);
      setPageDescription(description);
      setAddButtonText(buttonText);
    };
    
    loadTranslations();
  }, [t, translateText, isRTL]);

  const handleAddAgreement = () => {
    navigate('/agreements/add');
  };

  return (
    <PageContainer
      title={pageTitle || t('agreements.title')}
      description={pageDescription || t('agreements.description')}
      actions={
        <Button 
          onClick={handleAddAgreement}
          className={cn("gap-2", isRTL ? "flex-row-reverse" : "")}
        >
          <Plus className="h-4 w-4" />
          {addButtonText || t('agreements.newAgreement')}
        </Button>
      }
    >
      <AgreementList />
    </PageContainer>
  );
};

export default Agreements;
