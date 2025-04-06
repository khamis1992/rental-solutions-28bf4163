
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { normalizeLicensePlate } from '@/utils/searchUtils';

const Agreements = () => {
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  const { isRTL, translateText } = useTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [addButtonText, setAddButtonText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

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

  // Debounce the search input to prevent too many re-renders
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Handle vehicle number search input changes
  const handleVehicleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVehicleSearchQuery(value);
    
    // Use normalized license plate search for better matching
    if (value.trim()) {
      const normalizedValue = normalizeLicensePlate(value);
      debouncedSetSearch(normalizedValue);
    } else {
      debouncedSetSearch('');
    }
  };

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
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by vehicle license plate..."
            className="pl-8 w-full md:w-[300px]"
            value={vehicleSearchQuery}
            onChange={handleVehicleSearchChange}
          />
        </div>
      </div>
      <AgreementList searchQuery={searchQuery} />
    </PageContainer>
  );
};

export default Agreements;
