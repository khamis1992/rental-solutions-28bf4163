
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { VehicleFormData } from '@/types/vehicle';
import { useTranslation } from 'react-i18next';

const AddVehicle = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { useCreateVehicle } = useVehicles();
  const createVehicle = useCreateVehicle();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: VehicleFormData) => {
    try {
      setIsLoading(true);
      await createVehicle.mutateAsync(data);
      navigate('/vehicles');
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast.error(t('vehicles.createError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title={t('vehicles.addNewVehicle')}
      description={t('vehicles.addNewVehicleDesc')}
      backLink="/vehicles"
    >
      <VehicleForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </PageContainer>
  );
};

export default AddVehicle;
