
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleForm from '@/components/vehicles/VehicleForm';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';

const AddVehicle = () => {
  const navigate = useNavigate();
  const vehiclesHook = useVehicles();
  const { mutate: createVehicle, isPending } = vehiclesHook.useCreateVehicle();
  const { t } = useTranslation();
  const { isRTL } = useContextTranslation();
  
  const handleSubmit = (formData: any) => {
    console.log('AddVehicle: Submitting form data:', formData);
    createVehicle(formData, {
      onSuccess: () => {
        toast.success(t('vehicles.addSuccess'));
        navigate('/vehicles');
      },
      onError: (error) => {
        toast.error(t('common.error'), {
          description: error instanceof Error ? error.message : t('vehicles.unknownError')
        });
      }
    });
  };
  
  return (
    <PageContainer
      title={t('vehicles.addNew')}
      description={t('vehicles.addToFleet')}
      backLink="/vehicles"
    >
      <SectionHeader
        title={t('vehicles.addNew')}
        description={t('vehicles.addToFleet')}
        icon={Car}
        actions={
          <CustomButton 
            size="sm" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('vehicles.backToVehicles')}
          </CustomButton>
        }
      />
      
      <div className="section-transition">
        <VehicleForm 
          onSubmit={handleSubmit} 
          isLoading={isPending} 
        />
      </div>
    </PageContainer>
  );
};

export default AddVehicle;
