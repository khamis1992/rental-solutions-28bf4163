
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { useVehicles } from '@/hooks/use-vehicles';
import { VehicleFormData } from '@/types/vehicle';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { useVehicle, useUpdateVehicle } = useVehicles();
  const { data: vehicle, isLoading: isLoadingVehicle, error } = useVehicle(id || '');
  const updateVehicle = useUpdateVehicle();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(t('vehicles.loadError'));
      navigate('/vehicles');
    }
  }, [error, navigate, t]);

  const handleSubmit = async (data: VehicleFormData) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      await updateVehicle.mutateAsync({ id, formData: data });
      navigate(`/vehicles/${id}`);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error(t('vehicles.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title={t('vehicles.editVehicle')}
      description={t('vehicles.editVehicleDesc')}
      backLink={`/vehicles/${id}`}
    >
      {isLoadingVehicle ? (
        <Skeleton className="h-[800px]" />
      ) : (
        <VehicleForm
          initialData={vehicle}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          isEditMode={true}
        />
      )}
    </PageContainer>
  );
};

export default EditVehicle;
