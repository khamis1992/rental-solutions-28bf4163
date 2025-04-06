
import React, { useState, useEffect, useCallback } from 'react';
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
import { ErrorBoundary } from '@/components/ui/error-boundary';

const Agreements = () => {
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  const { isRTL, translateText } = useTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [addButtonText, setAddButtonText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Pre-translate the page title, description, and button text to avoid flickering
  useEffect(() => {
    let isMounted = true;
    setIsTranslating(true);
    
    const loadTranslations = async () => {
      try {
        const [title, description, buttonText] = await Promise.all([
          translateText(t('agreements.title')),
          translateText(t('agreements.description')),
          translateText(t('agreements.newAgreement'))
        ]);
        
        if (isMounted) {
          setPageTitle(title);
          setPageDescription(description);
          setAddButtonText(buttonText);
        }
      } catch (error) {
        console.error("Translation error:", error);
        // Fallback to direct translations if translateText fails
        setPageTitle(t('agreements.title'));
        setPageDescription(t('agreements.description'));
        setAddButtonText(t('agreements.newAgreement'));
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };
    
    loadTranslations();
    
    return () => {
      isMounted = false;
    };
  }, [t, translateText, isRTL]);

  // Debounce the search input to prevent too many re-renders
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Handle vehicle number search input changes
  const handleVehicleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVehicleSearchQuery(value);
    
    // Use normalized license plate search for better matching
    if (value.trim()) {
      const normalizedValue = normalizeLicensePlate(value);
      debouncedSetSearch(normalizedValue);
    } else {
      debouncedSetSearch('');
    }
  }, [debouncedSetSearch]);

  const handleAddAgreement = useCallback(() => {
    navigate('/agreements/add');
  }, [navigate]);

  return (
    <ErrorBoundary>
      <PageContainer
        title={pageTitle || t('agreements.title')}
        description={pageDescription || t('agreements.description')}
        actions={
          <Button 
            onClick={handleAddAgreement}
            className={cn("gap-2", isRTL ? "flex-row-reverse" : "")}
            disabled={isTranslating}
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
    </ErrorBoundary>
  );
};

export default Agreements;
