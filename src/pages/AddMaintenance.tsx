
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import PageContainer from '@/components/layout/PageContainer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';

const AddMaintenance = () => {
  const navigate = useNavigate();
  const { create } = useMaintenance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ensure the maintenance type is a valid enum value
  const validateMaintenanceType = (type: string): keyof typeof MaintenanceType => {
    if (Object.values(MaintenanceType).includes(type as any)) {
      return type as keyof typeof MaintenanceType;
    }
    return 'REGULAR_INSPECTION';
  };
  
  // Ensure the status is a valid enum value
  const validateMaintenanceStatus = (status: string): keyof typeof MaintenanceStatus => {
    if (Object.values(MaintenanceStatus).includes(status as any)) {
      return status as keyof typeof MaintenanceStatus;
    }
    return 'scheduled';
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate and convert form data to ensure correct types
      const validatedData = {
        ...formData,
        maintenance_type: validateMaintenanceType(formData.maintenance_type),
        status: validateMaintenanceStatus(formData.status),
      };
      
      await create.mutateAsync(validatedData);
      navigate('/maintenance');
    } catch (err) {
      console.error('Error creating maintenance record:', err);
      setError('Failed to create maintenance record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer 
      title="Add Maintenance Record" 
      description="Create a new maintenance record for a vehicle"
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <MaintenanceForm
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
};

export default AddMaintenance;
