
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
  const { getAllRecords, update } = useMaintenance();
  const [maintenance, setMaintenance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch maintenance record
  useEffect(() => {
    const fetchMaintenance = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const records = await getAllRecords();
        const record = records.find(r => r.id === id);
        
        if (record) {
          setMaintenance(record);
        } else {
          setError('Maintenance record not found');
        }
      } catch (err) {
        console.error('Error fetching maintenance record:', err);
        setError('Failed to load maintenance record');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaintenance();
  }, [id, getAllRecords]);

  // Convert string maintenance type to enum
  const mapStringToMaintenanceType = (typeString: string): string => {
    if (Object.values(MaintenanceType).includes(typeString as any)) {
      return typeString;
    }
    return MaintenanceType.OTHER;
  };

  // Convert string status to enum
  const mapStringToMaintenanceStatus = (statusString: string): string => {
    if (Object.values(MaintenanceStatus).includes(statusString as any)) {
      return statusString;
    }
    return MaintenanceStatus.SCHEDULED;
  };

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
