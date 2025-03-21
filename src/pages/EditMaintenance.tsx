
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import type { Maintenance } from '@/lib/validation-schemas/maintenance';

const EditMaintenance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { useOne, useUpdate } = useMaintenance();
  const { data: maintenance, isLoading, error } = useOne(id);
  const { mutate: updateMaintenance, isPending: isUpdating } = useUpdate();

  const handleSubmit = (data: Maintenance) => {
    if (!id) return;
    
    // Ensure we include the ID
    const updatedData = { ...data, id };
    
    updateMaintenance(updatedData, {
      onSuccess: () => {
        navigate('/maintenance');
      }
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <PageContainer
        title="Edit Maintenance Record"
        description="Update vehicle maintenance details"
        backLink="/maintenance"
      >
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/4" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Error state
  if (error || !maintenance) {
    return (
      <PageContainer
        title="Edit Maintenance Record"
        description="Update vehicle maintenance details"
        backLink="/maintenance"
      >
        <Card>
          <CardContent className="p-6">
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">
              <h3 className="text-lg font-medium">Error Loading Maintenance Record</h3>
              <p>
                {error instanceof Error 
                  ? error.message 
                  : 'Maintenance record not found or could not be loaded'}
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Maintenance Record"
      description="Update vehicle maintenance details"
      backLink="/maintenance"
    >
      <MaintenanceForm
        initialData={maintenance}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
        isEditMode={true}
      />
    </PageContainer>
  );
};

export default EditMaintenance;
