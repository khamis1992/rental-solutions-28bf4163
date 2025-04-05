
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VehicleGrid } from '@/components/vehicles/VehicleGrid';
import { useTranslation } from 'react-i18next';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';

const Vehicles = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL, translateText } = useContextTranslation();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [addButtonText, setAddButtonText] = useState('');

  // Pre-translate the page title, description, and button text to avoid flickering
  useEffect(() => {
    const loadTranslations = async () => {
      const title = await translateText(t('vehicles.title'));
      const description = await translateText(t('vehicles.description'));
      const buttonText = await translateText(t('vehicles.addVehicle'));
      
      setPageTitle(title);
      setPageDescription(description);
      setAddButtonText(buttonText);
    };
    
    loadTranslations();
  }, [t, translateText, isRTL]);

  const handleAddVehicle = () => {
    navigate('/vehicles/add');
  };

  return (
    <PageContainer
      title={pageTitle || t('vehicles.title')}
      description={pageDescription || t('vehicles.description')}
      actions={
        <Button 
          onClick={handleAddVehicle}
          className={cn("gap-2", isRTL ? "flex-row-reverse" : "")}
        >
          <Plus className="h-4 w-4" />
          {addButtonText || t('vehicles.addVehicle')}
        </Button>
      }
    >
      <VehicleGrid />
    </PageContainer>
  );
};

export default Vehicles;
