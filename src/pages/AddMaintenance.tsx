
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import { createEmptyMaintenance } from '@/lib/validation-schemas/maintenance';
import type { Maintenance } from '@/lib/validation-schemas/maintenance';

const AddMaintenance = () => {
  const navigate = useNavigate();
  const { useCreate } = useMaintenance();
  const { mutate: createMaintenance, isPending } = useCreate();

  const handleSubmit = (data: Omit<Maintenance, 'id'>) => {
    createMaintenance(data, {
      onSuccess: () => {
        navigate('/maintenance');
      }
    });
  };

  return (
    <PageContainer
      title="Add Maintenance Record"
      description="Create a new vehicle maintenance record"
      backLink="/maintenance"
    >
      <MaintenanceForm
        initialData={createEmptyMaintenance()}
        onSubmit={handleSubmit}
        isLoading={isPending}
      />
    </PageContainer>
  );
};

export default AddMaintenance;
