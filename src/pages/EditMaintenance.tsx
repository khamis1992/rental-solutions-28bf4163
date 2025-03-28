
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PageContainer from '@/components/layout/PageContainer';
import { useMaintenance } from '@/hooks/use-maintenance';
import { Skeleton } from '@/components/ui/skeleton';

const EditMaintenance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, update } = useMaintenance();
  const [error, setError] = useState<string | null>(null);
  
  const { data: maintenance, isLoading: isLoadingMaintenance, error: fetchError } = getById(id as string);
  
  const handleUpdate = (formData: any) => {
    if (!id) return;
    
    update.mutate({ 
      id, 
      data: formData 
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
        initialData={maintenance}
        onSubmit={handleUpdate}
        isLoading={update.isPending}
        isEditMode={true}
        submitLabel="Update Maintenance"
      />
    </PageContainer>
  );
};

export default EditMaintenance;
