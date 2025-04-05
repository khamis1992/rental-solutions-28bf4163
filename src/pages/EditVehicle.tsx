
// Adding the useUpdate replacement
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleForm from '@/components/vehicles/VehicleForm';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';
import { Skeleton } from '@/components/ui/skeleton';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useVehicle } = useVehicles();
  const vehiclesHook = useVehicles();
  const { mutate: updateVehicle, isPending: isUpdating } = vehiclesHook.useUpdateVehicle();
  const { data: vehicle, isLoading, error } = useVehicle(id || '');

  const { t } = useTranslation();
  const { isRTL } = useContextTranslation();

  const handleSubmit = (formData: any) => {
    if (!id) return;

    console.log('EditVehicle: Updating vehicle data:', formData);
    updateVehicle({
      id,
      formData
    }, {
      onSuccess: () => {
        toast.success(t('vehicles.updateSuccess'));
        navigate('/vehicles');
      },
      onError: (error) => {
        toast.error(t('common.error'), {
          description: error instanceof Error ? error.message : t('vehicles.unknownError')
        });
      }
    });
  };

  if (isLoading) {
    return (
      <PageContainer title={t('vehicles.editTitle')} description={t('vehicles.editDescription')}>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !vehicle) {
    return (
      <PageContainer title={t('vehicles.editTitle')} description={t('vehicles.editDescription')}>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <h3 className="font-medium text-lg">{t('vehicles.notFound')}</h3>
          <p>{t('vehicles.errorLoadingVehicle')}</p>
          <CustomButton 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
            className="mt-4"
          >
            {t('common.backToList')}
          </CustomButton>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${t('vehicles.editTitle')} - ${vehicle.make} ${vehicle.model}`}
      description={t('vehicles.editDescription')}
      backLink="/vehicles"
    >
      <SectionHeader
        title={`${t('vehicles.editTitle')} - ${vehicle.make} ${vehicle.model}`}
        description={t('vehicles.editDescription')}
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
          initialData={vehicle} 
          onSubmit={handleSubmit} 
          isLoading={isUpdating}
          isEditMode={true}
        />
      </div>
    </PageContainer>
  );
};

export default EditVehicle;
