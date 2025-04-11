
import React, { useState, useEffect } from 'react';
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
import { Vehicle, VehicleStatus } from '@/types/vehicle';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  
  // Local loading states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  const { useVehicle, useUpdate } = useVehicles();
  const { 
    data: fetchedVehicle, 
    isLoading: isFetching, 
    error: fetchError, 
    refetch 
  } = useVehicle(id || '');
  
  const { 
    mutate: updateVehicle, 
    isPending: isUpdating,
    isSuccess: isUpdateSuccess
  } = useUpdate();
  
  // Sync fetched data with local state
  useEffect(() => {
    if (fetchedVehicle) {
      console.log("Vehicle data received from API:", fetchedVehicle);
      setVehicle(fetchedVehicle);
      setIsLoading(false);
      setLoadError(null);
    }
    
    if (isFetching) {
      setIsLoading(true);
    }
    
    if (fetchError) {
      setIsLoading(false);
      setLoadError(fetchError instanceof Error ? fetchError : new Error('Failed to fetch vehicle'));
      console.error('Vehicle fetch error:', fetchError);
    }
  }, [fetchedVehicle, isFetching, fetchError]);

  // When update is successful, refresh the data
  useEffect(() => {
    if (isUpdateSuccess) {
      console.log("Update successful, refreshing data");
      // Short timeout to allow the server to process the update
      setTimeout(() => {
        refetch();
      }, 300);
    }
  }, [isUpdateSuccess, refetch]);
  
  const handleSubmit = async (formData: any) => {
    if (!vehicle || !id) return;
    
    try {
      console.log("Submitting form data:", formData);
      updateVehicle(
        { id, data: formData },
        {
          onSuccess: () => {
            toast.success('Vehicle updated successfully');
            // Navigate after a short delay to ensure the update is processed
            setTimeout(() => {
              navigate(`/vehicles/${id}`);
            }, 500);
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
  
  // Handle status update completion
  const handleStatusUpdated = () => {
    console.log('Status updated, refreshing vehicle data');
    refetch();
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
  
  if (loadError || !vehicle) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Vehicle Not Found</h2>
          <p>The vehicle you're trying to edit doesn't exist or has been removed.</p>
          <p className="text-sm mt-1 text-red-600">Error: {loadError?.message || 'Vehicle data unavailable'}</p>
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

  // Ensure status is a valid VehicleStatus or provide a default
  const vehicleStatus = vehicle.status || 'available';
  // Ensure the status is one of the allowed values
  const validatedStatus: VehicleStatus = 
    ['available', 'rented', 'reserved', 'maintenance', 'police_station', 'accident', 'stolen', 'retired']
      .includes(vehicleStatus as string) 
        ? vehicleStatus as VehicleStatus 
        : 'available';
  
  return (
    <PageContainer>
      <SectionHeader
        title={`Edit Vehicle: ${vehicle.make} ${vehicle.model}`}
        description={`${vehicle.year} • ${vehicle.licensePlate || vehicle.license_plate}`}
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

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        currentStatus={validatedStatus}
        vehicleId={vehicle.id}
        vehicleDetails={{
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate || vehicle.license_plate || ''
        }}
        onStatusUpdated={handleStatusUpdated}
      />
    </PageContainer>
  );
};

export default EditVehicle;
