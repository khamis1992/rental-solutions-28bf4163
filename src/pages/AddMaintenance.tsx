
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import { createEmptyMaintenance } from '@/lib/validation-schemas/maintenance';
import type { Maintenance } from '@/lib/validation-schemas/maintenance';
import { useToast } from '@/hooks/use-toast';

const AddMaintenance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { useCreate } = useMaintenance();
  const { mutate: createMaintenance, isPending } = useCreate();
  const [initialData, setInitialData] = useState(createEmptyMaintenance());

  useEffect(() => {
    // Check if there's a vehicleId in the URL params and pre-select it
    const params = new URLSearchParams(location.search);
    const vehicleId = params.get('vehicleId');
    
    if (vehicleId) {
      setInitialData(prev => ({
        ...prev,
        vehicle_id: vehicleId
      }));
    }
  }, [location.search]);

  const handleSubmit = (data: Omit<Maintenance, 'id'>) => {
    createMaintenance(data, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Maintenance record created successfully",
        });
        navigate('/maintenance');
      },
      onError: (error) => {
        console.error("Error creating maintenance record:", error);
        toast({
          title: "Error",
          description: "Failed to create maintenance record",
          variant: "destructive",
        });
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
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={isPending}
      />
    </PageContainer>
  );
};

export default AddMaintenance;
