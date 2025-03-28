
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PageContainer from '@/components/layout/PageContainer';
import { useMaintenance } from '@/hooks/use-maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';

const EditMaintenance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useOne, useUpdate } = useMaintenance();
  const [error, setError] = useState<string | null>(null);
  
  const { data: maintenance, isLoading: isLoadingMaintenance, error: fetchError } = useOne(id as string);
  const updateMutation = useUpdate;
  
  const handleUpdate = (formData: any) => {
    if (!id) return;
    
    // Convert dates to strings before submitting to API
    const formattedData = {
      ...formData,
      scheduled_date: formData.scheduled_date instanceof Date 
        ? formData.scheduled_date.toISOString() 
        : formData.scheduled_date,
      completion_date: formData.completion_date instanceof Date 
        ? formData.completion_date.toISOString() 
        : formData.completion_date,
      // Map to fields expected by API
      performed_by: formData.service_provider,
      completed_date: formData.completion_date instanceof Date 
        ? formData.completion_date.toISOString() 
        : formData.completion_date,
      // Add any other required fields
      service_type: formData.maintenance_type,
      category_id: formData.category_id || null,
      // Convert uppercase maintenance types to lowercase for API
      maintenance_type: convertMaintenanceTypeForApi(formData.maintenance_type)
    };
    
    updateMutation.mutate({ 
      id, 
      data: formattedData 
    }, {
      onSuccess: () => {
        navigate(`/maintenance/${id}`);
      },
      onError: (error: any) => {
        setError(error.message || 'Failed to update maintenance record');
      }
    });
  };
  
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
  
  // Map the API maintenance type to the form value that uses enum values
  const mapMaintenanceType = (type: string): string => {
    // Handle uppercase values
    if (type === 'OIL_CHANGE') return MaintenanceType.OIL_CHANGE;
    if (type === 'TIRE_REPLACEMENT') return MaintenanceType.TIRE_REPLACEMENT;
    if (type === 'BRAKE_SERVICE') return MaintenanceType.BRAKE_SERVICE;
    if (type === 'REGULAR_INSPECTION') return MaintenanceType.REGULAR_INSPECTION;
    if (type === 'ENGINE_REPAIR') return MaintenanceType.ENGINE_REPAIR;
    if (type === 'TRANSMISSION_SERVICE') return MaintenanceType.TRANSMISSION_SERVICE;
    if (type === 'ELECTRICAL_REPAIR') return MaintenanceType.ELECTRICAL_REPAIR;
    if (type === 'BODY_REPAIR') return MaintenanceType.BODY_REPAIR;
    if (type === 'AIR_CONDITIONING') return MaintenanceType.AIR_CONDITIONING;
    if (type === 'OTHER') return MaintenanceType.OTHER;
    
    // Handle lowercase values
    if (type === 'oil_change') return MaintenanceType.OIL_CHANGE;
    if (type === 'tire_replacement') return MaintenanceType.TIRE_REPLACEMENT;
    if (type === 'brake_service') return MaintenanceType.BRAKE_SERVICE;
    if (type === 'regular_inspection') return MaintenanceType.REGULAR_INSPECTION;
    if (type === 'engine_repair') return MaintenanceType.ENGINE_REPAIR;
    if (type === 'transmission_service') return MaintenanceType.TRANSMISSION_SERVICE;
    if (type === 'electrical_repair') return MaintenanceType.ELECTRICAL_REPAIR;
    if (type === 'body_repair') return MaintenanceType.BODY_REPAIR;
    if (type === 'air_conditioning') return MaintenanceType.AIR_CONDITIONING;
    if (type === 'other') return MaintenanceType.OTHER;
    
    // Default fallback value
    return MaintenanceType.REGULAR_INSPECTION;
  };
  
  if (isLoadingMaintenance) {
    return (
      <PageContainer title="Edit Maintenance Record" backLink={`/maintenance/${id}`}>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-32" />
        </div>
      </PageContainer>
    );
  }
  
  if (fetchError || !maintenance) {
    return (
      <PageContainer title="Edit Maintenance Record" backLink="/maintenance">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {fetchError ? String(fetchError) : 'Maintenance record not found'}
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/maintenance')}>
          Back to Maintenance
        </Button>
      </PageContainer>
    );
  }
  
  // Convert API maintenance data to form compatible data
  const formData = {
    ...maintenance,
    // Convert string dates to Date objects for the form
    scheduled_date: maintenance.scheduled_date ? new Date(maintenance.scheduled_date) : new Date(),
    completion_date: maintenance.completed_date ? new Date(maintenance.completed_date) : undefined,
    // Map fields to expected names
    service_provider: maintenance.service_provider || maintenance.performed_by || '',
    // Map maintenance_type to enum value expected by the form
    maintenance_type: mapMaintenanceType(maintenance.maintenance_type || ''),
    // Ensure created_at is handled properly
    created_at: maintenance.created_at ? new Date(maintenance.created_at) : undefined,
    updated_at: maintenance.updated_at ? new Date(maintenance.updated_at) : undefined
  };
  
  return (
    <PageContainer title="Edit Maintenance Record" backLink={`/maintenance/${id}`}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <MaintenanceForm 
        initialData={formData}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
        isEditMode={true}
        submitLabel="Update Maintenance"
      />
    </PageContainer>
  );
};

export default EditMaintenance;
