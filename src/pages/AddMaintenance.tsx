
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import PageContainer from '@/components/layout/PageContainer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { useToast } from '@/hooks/use-toast';
import { logOperation } from '@/utils/monitoring-utils';

const AddMaintenance = () => {
  const navigate = useNavigate();
  const { create } = useMaintenance();
  const { toast } = useToast();
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
  const validateMaintenanceStatus = (status: string): "scheduled" | "in_progress" | "completed" | "cancelled" => {
    const validStatus = ["scheduled", "in_progress", "completed", "cancelled"];
    if (validStatus.includes(status)) {
      return status as "scheduled" | "in_progress" | "completed" | "cancelled";
    }
    return 'scheduled';
  };

  const handleSubmit = async (formData: any) => {
    logOperation(
      'maintenance.create.submit', 
      'success', 
      { formData },
      'Form submitted with data'
    );
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data for API submission
      const preparedData = {
        ...formData,
        // Ensure these fields are properly validated
        maintenance_type: validateMaintenanceType(formData.maintenance_type || MaintenanceType.REGULAR_INSPECTION),
        status: validateMaintenanceStatus(formData.status || MaintenanceStatus.SCHEDULED),
        // Ensure vehicle_id is never empty
        vehicle_id: formData.vehicle_id || null,
        // Ensure cost is a number
        cost: typeof formData.cost === 'number' ? formData.cost : parseFloat(formData.cost) || 0,
      };
      
      logOperation(
        'maintenance.create.prepare', 
        'success', 
        { preparedData },
        'Prepared data for submission'
      );
      
      await create.mutateAsync(preparedData);
      
      toast({
        title: "Success",
        description: "Maintenance record created successfully",
        variant: "default"
      });
      
      navigate('/maintenance');
    } catch (err: any) {
      logOperation(
        'maintenance.create', 
        'error', 
        { error: err.message || String(err) },
        'Error creating maintenance record'
      );
      setError(err.message || 'Failed to create maintenance record. Please try again.');
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
