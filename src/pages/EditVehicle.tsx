
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
import { logOperation } from '@/utils/monitoring-utils';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [updateCompleted, setUpdateCompleted] = useState(false);
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState(false);
  
  // Local loading states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  } = useUpdate();
  
  // Sync fetched data with local state, forcing an update when status changes
  useEffect(() => {
    if (fetchedVehicle) {
      logOperation('vehicle.fetch', 'success', 
        { id: fetchedVehicle.id, make: fetchedVehicle.make, model: fetchedVehicle.model },
        'Vehicle data received from API');
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
      logOperation('vehicle.fetch', 'error', 
        { error: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        'Vehicle fetch error');
    }
  }, [fetchedVehicle, isFetching, fetchError]);

  // Handle navigation after update is completed
  useEffect(() => {
    if (updateCompleted && !isSubmitting && !isUpdating) {
      // Use a timeout to ensure we don't navigate too quickly before state updates are processed
      const timer = setTimeout(() => {
        navigate(`/vehicles/${id}`);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [updateCompleted, isSubmitting, isUpdating, navigate, id]);
  
  const handleSubmit = async (formData: any) => {
    if (!vehicle || !id) return;
    setUpdateCompleted(false);
    
    try {
      setIsSubmitting(true);
      logOperation('vehicle.update', 'success', 
        { id, ...formData },
        'Submitting form data');
      
      // Make sure to preserve the current status if not changed in the form
      if (!formData.status && vehicle.status) {
        logOperation('vehicle.update', 'success', 
          { id, status: vehicle.status },
          'Preserving current status');
        formData.status = vehicle.status;
      }
      
      // Make sure status is properly handled
      if (formData.status) {
        logOperation('vehicle.update', 'success', 
          { id, status: formData.status },
          'Status being submitted');
      }
      
      await new Promise<void>((resolve, reject) => {
        updateVehicle(
          { id, data: formData },
          {
            onSuccess: async () => {
              logOperation('vehicle.update', 'success', 
                { id },
                'Update successful, refreshing data');
              try {
                // Force data refresh from server before navigating
                await refetch();
                toast.success('Vehicle updated successfully');
                setUpdateCompleted(true);
                resolve();
              } catch (refreshError) {
                logOperation('vehicle.update', 'error', 
                  { id, error: refreshError instanceof Error ? refreshError.message : String(refreshError) },
                  'Error refreshing data');
                reject(refreshError);
              }
            },
            onError: (error) => {
              logOperation('vehicle.update', 'error', 
                { id, error: error instanceof Error ? error.message : String(error) },
                'Update vehicle error');
              toast.error('Failed to update vehicle', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
              });
              reject(error);
            },
            onSettled: () => {
              setIsSubmitting(false);
            }
          }
        );
      });
    } catch (error) {
      setIsSubmitting(false);
      logOperation('vehicle.update', 'error', 
        { id, error: error instanceof Error ? error.message : String(error) },
        'Edit vehicle submission error');
      toast.error('Error submitting form', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };
  
  // Handle status update completion with forced refresh
  const handleStatusUpdated = async (): Promise<boolean> => {
    logOperation('vehicle.status', 'success', 
      { id: id || '' },
      'Status updated, refreshing vehicle data');
    setStatusUpdateInProgress(true);
    
    try {
      // Force cache invalidation and get fresh data
      const refreshResult = await refetch();
      
      logOperation('vehicle.status', 'success', 
        { id: id || '', hasError: !!refreshResult.error },
        'Data refresh completed');
      
      if (refreshResult.error) {
        throw refreshResult.error;
      }
      
      if (refreshResult.data) {
        // Update local state to ensure UI reflects the latest status
        setVehicle(refreshResult.data);
        logOperation('vehicle.status', 'success', 
          { id: id || '', status: refreshResult.data.status },
          'Local vehicle state updated with new data');
      }
      
      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return success to the caller
      return true;
    } catch (error) {
      logOperation('vehicle.status', 'error', 
        { id: id || '', error: error instanceof Error ? error.message : String(error) },
        'Error refreshing data after status update');
      toast.error('Failed to refresh data after status update');
      throw error;
    } finally {
      setStatusUpdateInProgress(false);
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
  const vehicleStatus = vehicle?.status || 'available';
  // Ensure the status is one of the allowed values
  const validatedStatus: VehicleStatus = 
    ['available', 'rented', 'reserved', 'maintenance', 'police_station', 'accident', 'stolen', 'retired']
      .includes(vehicleStatus as string) 
        ? vehicleStatus as VehicleStatus 
        : 'available';
  
  logOperation('vehicle.ui', 'success', 
    { id: id || '', status: validatedStatus },
    'Rendering vehicle with status');
  
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
              onClick={() => {
                logOperation('vehicle.ui', 'success', 
                  { id: id || '', status: validatedStatus },
                  'Opening status update dialog with status');
                setShowStatusDialog(true);
              }}
              disabled={statusUpdateInProgress}
            >
              {statusUpdateInProgress ? 'Updating Status...' : 'Update Status'}
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
          key={`vehicle-form-${vehicle.id}-${vehicle.updated_at}-${vehicle.status}`}
          initialData={vehicle}
          onSubmit={handleSubmit} 
          isLoading={isUpdating || isSubmitting}
          isEditMode={true}
        />
      </div>

      {/* Status Update Dialog - With proper sync of current status */}
      <StatusUpdateDialog
        isOpen={showStatusDialog}
        onClose={() => {
          logOperation('vehicle.ui', 'success', 
            { id: id || '' },
            'Closing status update dialog');
          setShowStatusDialog(false);
        }}
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
