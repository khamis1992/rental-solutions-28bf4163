
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import PageContainer from '@/components/layout/PageContainer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader } from 'lucide-react';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MaintenanceRecord } from '@/types/maintenance';

const EditMaintenance = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceRecord | null>(null);
  const { update, maintenanceRecords } = useMaintenance('maintenance');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch maintenance data
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      if (!id) {
        setError('No maintenance ID provided');
        setIsLoading(false);
        return;
      }
      
      try {
        // Find the maintenance record in the existing data
        const record = maintenanceRecords.find(record => record.id === id);
        
        if (!record) {
          setError('Maintenance record not found');
          setIsLoading(false);
          return;
        }
        
        setMaintenanceData(record);
      } catch (err: any) {
        console.error('Error fetching maintenance record:', err);
        setError(err.message || 'Failed to fetch maintenance record');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaintenanceData();
  }, [id, maintenanceRecords]);
  
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
    if (!id) return;
    
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
      
      console.log("Prepared data for update:", preparedData);
      
      await update.mutateAsync({ id, data: preparedData });
      
      toast.success("Maintenance record updated successfully");
      
      navigate('/maintenance');
    } catch (err: any) {
      console.error('Error updating maintenance record:', err);
      setError(err.message || 'Failed to update maintenance record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Edit Maintenance Record">
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin h-8 w-8 text-primary" />
          <span className="ml-2">Loading maintenance record...</span>
        </div>
      </PageContainer>
    );
  }

  if (error || !maintenanceData) {
    return (
      <PageContainer title="Edit Maintenance Record">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Maintenance record not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/maintenance')}>Back to Maintenance</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Edit Maintenance Record" 
      description="Update an existing maintenance record"
    >
      <MaintenanceForm
        initialData={maintenanceData}
        onSubmit={handleSubmit}
        isEditMode={true}
      />
    </PageContainer>
  );
};

export default EditMaintenance;
