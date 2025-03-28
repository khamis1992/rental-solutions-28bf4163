
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import { createEmptyMaintenance, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import type { Maintenance } from '@/lib/validation-schemas/maintenance';
import { useToast } from '@/hooks/use-toast';
import type { MaintenanceRecord } from '@/hooks/use-maintenance';

const AddMaintenance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { create } = useMaintenance();
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

  // Helper function to convert UI maintenance type to API format
  const convertMaintenanceTypeForApi = (type: string): string => {
    // Map uppercase enum values to lowercase API values
    switch (type) {
      case MaintenanceType.OIL_CHANGE: return "oil_change";
      case MaintenanceType.TIRE_REPLACEMENT: return "tire_replacement";
      case MaintenanceType.BRAKE_SERVICE: return "brake_service";
      case MaintenanceType.REGULAR_INSPECTION: return "regular_inspection";
      case MaintenanceType.ENGINE_REPAIR: return "engine_repair";
      case MaintenanceType.TRANSMISSION_SERVICE: return "transmission_service";
      case MaintenanceType.ELECTRICAL_REPAIR: return "electrical_repair";
      case MaintenanceType.BODY_REPAIR: return "body_repair";
      case MaintenanceType.AIR_CONDITIONING: return "air_conditioning";
      case MaintenanceType.OTHER: return "other";
      default: return "regular_inspection";
    }
  };

  const handleSubmit = (formData: Omit<Maintenance, 'id'>) => {
    console.log("Submitting maintenance record:", formData);
    
    // Convert to the format expected by the API
    const apiData: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'> = {
      vehicle_id: formData.vehicle_id,
      maintenance_type: convertMaintenanceTypeForApi(formData.maintenance_type),
      status: formData.status,
      description: formData.description || '',
      cost: formData.cost || 0,
      scheduled_date: formData.scheduled_date.toISOString(),
      completed_date: formData.completion_date ? formData.completion_date.toISOString() : null,
      performed_by: formData.service_provider || '',
      notes: formData.notes || '',
      service_type: convertMaintenanceTypeForApi(formData.maintenance_type), // Using maintenance_type as service_type
      category_id: null,
      // Other required fields with default values
      invoice_number: formData.invoice_number || '',
      odometer_reading: formData.odometer_reading || 0
    };
    
    create.mutate(apiData, {
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
        isLoading={create.isPending}
      />
    </PageContainer>
  );
};

export default AddMaintenance;
