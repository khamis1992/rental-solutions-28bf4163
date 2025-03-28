
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMaintenance } from '@/hooks/use-maintenance';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PageContainer from '@/components/layout/PageContainer';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';

const EditMaintenance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useDetail, update } = useMaintenance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert string maintenance type to enum
  const mapStringToMaintenanceType = (typeString: string): MaintenanceType => {
    if (Object.values(MaintenanceType).includes(typeString as MaintenanceType)) {
      return typeString as MaintenanceType;
    }
    return MaintenanceType.OTHER;
  };

  // Convert string status to enum
  const mapStringToMaintenanceStatus = (statusString: string): MaintenanceStatus => {
    if (Object.values(MaintenanceStatus).includes(statusString as MaintenanceStatus)) {
      return statusString as MaintenanceStatus;
    }
    return MaintenanceStatus.SCHEDULED;
  };

  // Fetch the maintenance record details
  const { data: maintenance, isLoading, error: fetchError } = useDetail(id);
  
  useEffect(() => {
    if (fetchError) {
      setError('Failed to load maintenance record');
    }
  }, [fetchError]);

  const handleSubmit = async (formData: any) => {
    if (!id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Ensure types match what's expected in the backend
      const updatedData = {
        ...formData,
        maintenance_type: mapStringToMaintenanceType(formData.maintenance_type),
        status: mapStringToMaintenanceStatus(formData.status),
      };
      
      await update.mutateAsync({ 
        id, 
        data: updatedData 
      });
      
      navigate('/maintenance');
    } catch (err) {
      console.error('Error updating maintenance record:', err);
      setError('Failed to update maintenance record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Edit Maintenance Record" description="Loading maintenance details...">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !maintenance) {
    return (
      <PageContainer title="Edit Maintenance Record" description="Error loading maintenance details">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Unable to load maintenance record'}
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  // Prepare the data for the form, ensuring correct types
  const formattedMaintenance = {
    ...maintenance,
    maintenance_type: mapStringToMaintenanceType(maintenance.maintenance_type),
    status: mapStringToMaintenanceStatus(maintenance.status),
  };

  return (
    <PageContainer 
      title="Edit Maintenance Record" 
      description="Update maintenance record details"
    >
      <MaintenanceForm
        initialData={formattedMaintenance}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isEditMode={true}
      />
    </PageContainer>
  );
};

export default EditMaintenance;
