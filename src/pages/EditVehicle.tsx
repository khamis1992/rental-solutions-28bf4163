
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleForm from '@/components/vehicles/VehicleForm';
import StatusUpdateDialog from '@/components/vehicles/StatusUpdateDialog';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  
  const { useVehicle, useUpdate } = useVehicles();
  const { data: vehicle, isLoading, error, refetch } = useVehicle(id || '');
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdate();
  
  const handleSubmit = async (formData: any) => {
    if (!vehicle || !id) return;
    
    try {
      updateVehicle(
        { id, data: formData },
        {
          onSuccess: () => {
            toast.success('Vehicle updated successfully');
            navigate(`/vehicles/${id}`);
          },
          onError: (error) => {
            console.error('Update vehicle error:', error);
            toast.error('Failed to update vehicle', {
              description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
          }
        }
      );
    } catch (error) {
      console.error('Edit vehicle submission error:', error);
      toast.error('Error submitting form', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };
  
  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-5 w-1/4 mt-1" />
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </PageContainer>
    );
  }
  
  if (error || !vehicle) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Vehicle Not Found</h2>
          <p>The vehicle you're trying to edit doesn't exist or has been removed.</p>
          <CustomButton 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Vehicles
          </CustomButton>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <SectionHeader
        title={`Edit Vehicle: ${vehicle.make} ${vehicle.model}`}
        description={`${vehicle.year} • ${vehicle.licensePlate}`}
        icon={Car}
        actions={
          <>
            <CustomButton 
              size="sm" 
              variant="outline"
              onClick={() => setShowStatusDialog(true)}
            >
              Update Status
            </CustomButton>
            <CustomButton 
              size="sm" 
              variant="outline" 
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </CustomButton>
          </>
        }
      />
      
      <div className="section-transition">
        <VehicleForm 
          initialData={vehicle}
          onSubmit={handleSubmit} 
          isLoading={isUpdating}
          isEditMode={true}
        />
      </div>

      <StatusUpdateDialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        currentStatus={vehicle.status}
        vehicleId={vehicle.id}
        vehicleDetails={{
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate
        }}
        onStatusUpdated={refetch}
      />
    </PageContainer>
  );
};

export default EditVehicle;
