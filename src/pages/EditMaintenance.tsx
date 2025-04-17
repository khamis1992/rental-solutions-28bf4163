import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMaintenance } from '@/hooks/use-maintenance';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PageContainer from '@/components/layout/PageContainer';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { useToast } from '@/hooks/use-toast';

const EditMaintenance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAllRecords, updateMaintenanceRecord } = useMaintenance();
  const { toast } = useToast();
  const [maintenance, setMaintenance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaintenance = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const records = await getAllRecords();
        const record = records.find(r => r.id === id);
        
        if (record) {
          console.log("Found maintenance record:", record);
          setMaintenance(record);
        } else {
          console.error("Maintenance record not found for ID:", id);
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

  const mapStringToMaintenanceType = (typeString: string): keyof typeof MaintenanceType => {
    if (typeString && Object.values(MaintenanceType).includes(typeString as any)) {
      return typeString as keyof typeof MaintenanceType;
    }
    return MaintenanceType.REGULAR_INSPECTION;
  };

  const mapStringToMaintenanceStatus = (statusString: string): "scheduled" | "in_progress" | "completed" | "cancelled" => {
    const validStatus = ["scheduled", "in_progress", "completed", "cancelled"];
    if (statusString && validStatus.includes(statusString)) {
      return statusString as "scheduled" | "in_progress" | "completed" | "cancelled";
    }
    return MaintenanceStatus.SCHEDULED;
  };

  const handleSubmit = async (formData: any) => {
    if (!id) return;
    
    console.log("Form submitted with data:", formData);
    setIsSubmitting(true);
    setError(null);
    
    try {
      const preparedData = {
        ...formData,
        maintenance_type: mapStringToMaintenanceType(formData.maintenance_type),
        status: mapStringToMaintenanceStatus(formData.status),
        vehicle_id: formData.vehicle_id || null,
        cost: typeof formData.cost === 'number' ? formData.cost : parseFloat(formData.cost) || 0,
      };
      
      console.log("Prepared data for update:", preparedData);
      
      await updateMaintenanceRecord({ id, ...preparedData });
      
      toast({
        title: "Success",
        description: "Maintenance record updated successfully",
        variant: "default"
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

  const formattedMaintenance = {
    ...maintenance,
    maintenance_type: mapStringToMaintenanceType(maintenance.maintenance_type),
    status: mapStringToMaintenanceStatus(maintenance.status),
    scheduled_date: maintenance.scheduled_date ? new Date(maintenance.scheduled_date) : new Date(),
    completion_date: maintenance.completion_date ? new Date(maintenance.completion_date) : undefined,
    vehicle_id: maintenance.vehicle_id || null,
  };

  console.log("Prepared maintenance record for form:", formattedMaintenance);

  return (
    <PageContainer 
      title="Edit Maintenance Record" 
      description="Update maintenance record details"
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
