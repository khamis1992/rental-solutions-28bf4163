
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
    service_provider: maintenance.service_provider || maintenance.performed_by,
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
