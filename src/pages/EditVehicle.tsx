
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
import LicensePlateChangeAlert from '@/components/vehicles/LicensePlateChangeAlert';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('edit-vehicle');

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [updateCompleted, setUpdateCompleted] = useState(false);
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState(false);
  const [originalLicensePlate, setOriginalLicensePlate] = useState<string | null>(null);
  const [showLicensePlateAlert, setShowLicensePlateAlert] = useState(false);
  
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
  
  // Store original license plate when vehicle is loaded
  useEffect(() => {
    if (fetchedVehicle) {
      logger.debug("Vehicle data received from API:", fetchedVehicle);
      setVehicle(fetchedVehicle);
      setIsLoading(false);
      setLoadError(null);
      
      // Store original license plate for comparison
      if (!originalLicensePlate) {
        setOriginalLicensePlate(fetchedVehicle.license_plate);
        logger.debug(`Stored original license plate: ${fetchedVehicle.license_plate}`);
      }
    }
    
    if (isFetching) {
      setIsLoading(true);
    }
    
    if (fetchError) {
      setIsLoading(false);
      setLoadError(fetchError instanceof Error ? fetchError : new Error('Failed to fetch vehicle'));
      logger.error('Vehicle fetch error:', fetchError);
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
      logger.debug("Submitting form data:", formData);
      
      // Check for license plate change
      if (originalLicensePlate && formData.license_plate !== originalLicensePlate) {
        logger.info(`License plate change detected: ${originalLicensePlate} → ${formData.license_plate}`);
      }
      
      // Make sure to preserve the current status if not changed in the form
      if (!formData.status && vehicle.status) {
        logger.debug(`Preserving current status: ${vehicle.status}`);
        formData.status = vehicle.status;
      }
      
      // Make sure status is properly handled
      if (formData.status) {
        logger.debug(`EditVehicle: Status being submitted: ${formData.status}`);
      }
      
      await new Promise<void>((resolve, reject) => {
        updateVehicle(
          { id, data: formData },
          {
            onSuccess: async () => {
              logger.debug("Update successful, refreshing data");
              try {
                // Force data refresh from server before navigating
                await refetch();
                toast.success('Vehicle updated successfully');
                
                // Check if license plate changed
                if (originalLicensePlate && formData.license_plate !== originalLicensePlate) {
                  // Show license plate change alert instead of navigating immediately
                  setShowLicensePlateAlert(true);
                } else {
                  setUpdateCompleted(true);
                }
                
                resolve();
              } catch (refreshError) {
                logger.error('Error refreshing data:', refreshError);
                reject(refreshError);
              }
            },
            onError: (error) => {
              logger.error('Update vehicle error:', error);
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
      logger.error('Edit vehicle submission error:', error);
      toast.error('Error submitting form', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };
  
  // Handle status update completion with forced refresh
  const handleStatusUpdated = async (): Promise<boolean> => {
    logger.debug('Status updated, refreshing vehicle data');
    setStatusUpdateInProgress(true);
    
    try {
      // Force cache invalidation and get fresh data
      const refreshResult = await refetch();
      
      logger.debug(`Data refresh completed:`, refreshResult);
      
      if (refreshResult.error) {
        throw refreshResult.error;
      }
      
      if (refreshResult.data) {
        // Update local state to ensure UI reflects the latest status
        setVehicle(refreshResult.data);
        logger.debug('Local vehicle state updated with new data:', refreshResult.data);
      }
      
      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return success to the caller
      return true;
    } catch (error) {
      logger.error('Error refreshing data after status update:', error);
      toast.error('Failed to refresh data after status update');
      throw error;
    } finally {
      setStatusUpdateInProgress(false);
    }
  };

  // Handle when license plate alert is completed
  const handleLicensePlateAlertComplete = () => {
    setShowLicensePlateAlert(false);
    setUpdateCompleted(true);
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
  
  logger.debug(`Rendering vehicle with status: ${validatedStatus}`);
  
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
                logger.debug("Opening status update dialog with status:", validatedStatus);
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
      
      {/* License plate change alert */}
      {showLicensePlateAlert && originalLicensePlate && vehicle && (
        <div className="mb-6">
          <LicensePlateChangeAlert
            oldLicensePlate={originalLicensePlate}
            newLicensePlate={vehicle.license_plate}
            vehicleId={vehicle.id}
            onComplete={handleLicensePlateAlertComplete}
          />
        </div>
      )}
      
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
          logger.debug("Closing status update dialog");
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
