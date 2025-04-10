import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Car, ArrowLeft, AlertOctagon, Loader2, WifiOff } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleForm from '@/components/vehicles/VehicleForm';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { checkSupabaseHealth, monitorDatabaseConnection } from '@/integrations/supabase/client';
import { getModelSpecificImage } from '@/lib/vehicles/vehicle-storage';
import { mapDatabaseStatus, mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [modelSpecificImage, setModelSpecificImage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { useVehicle, useUpdate, useConnectionStatus } = useVehicles();
  const { data: vehicle, isLoading, error, refetch } = useVehicle(id || '');
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdate();
  const { data: connectionStatus } = useConnectionStatus();
  
  useEffect(() => {
    const stopMonitoring = monitorDatabaseConnection(({ isConnected, error }) => {
      setIsConnected(isConnected);
      setConnectionError(error);
      
      if (isConnected && id) {
        refetch();
      }
    }, 15000);
    
    return () => stopMonitoring();
  }, [id, refetch]);
  
  useEffect(() => {
    if (connectionStatus === false) {
      toast.error('Database connection error', {
        description: 'Unable to connect to the database. Please check your internet connection.',
        id: 'db-connection-error'
      });
    }
  }, [connectionStatus]);
  
  useEffect(() => {
    if (!id) {
      console.error('No vehicle ID provided in URL');
      toast.error('No vehicle ID provided', {
        description: 'Please go back to the vehicles list and try again'
      });
      return;
    }
    
    console.log(`EditVehicle page loaded for vehicle ID: ${id}`);
    
    async function checkForModelImage() {
      if (vehicle?.model && vehicle.model.toLowerCase().includes('b70')) {
        console.log('Checking for B70 model-specific image');
        const imageUrl = await getModelSpecificImage(vehicle.model);
        console.log('Model-specific image found:', imageUrl);
        setModelSpecificImage(imageUrl);
      }
    }
    
    if (vehicle) {
      console.log('Vehicle data loaded:', vehicle);
      checkForModelImage();
    }
  }, [vehicle, id]);
  
  const ensureVehicleImagesBucket = async () => {
    try {
      console.log('Ensuring vehicle-images bucket exists');
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        setBucketError(`Error checking storage buckets: ${listError.message}`);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'vehicle-images');
      
      if (!bucketExists) {
        console.log('Creating vehicle-images bucket');
        const { error: createError } = await supabase.storage.createBucket('vehicle-images', {
          public: true,
          fileSizeLimit: 10485760,
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          setBucketError(`Error creating storage bucket: ${createError.message}`);
          return false;
        }
        
        console.log('Storage bucket created successfully');
        toast.success('Vehicle images storage bucket created successfully');
      } else {
        console.log('vehicle-images bucket already exists');
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring vehicle images bucket exists:', error);
      setBucketError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  const hasChanges = (formData: any, originalVehicle: any) => {
    if (!originalVehicle) {
      console.log('No original vehicle data, assuming changes exist');
      return true;
    }
    
    if (formData.image) {
      console.log('New image provided, changes detected');
      return true;
    }
    
    const fieldsToCompare = [
      'make', 'model', 'year', 'license_plate', 'vin', 'color', 
      'mileage', 'location', 'description', 'insurance_company', 
      'insurance_expiry', 'rent_amount'
    ];
    
    console.log('Status comparison:', {
      formStatus: formData.status,
      formDbStatus: mapToDBStatus(formData.status),
      originalStatus: originalVehicle.status,
      originalDbStatus: typeof originalVehicle.status === 'string' 
        ? originalVehicle.status 
        : mapToDBStatus(originalVehicle.status),
    });
    
    if (formData.status !== undefined) {
      const formDbStatus = mapToDBStatus(formData.status);
      const originalDbStatus = typeof originalVehicle.status === 'string' 
        ? originalVehicle.status 
        : mapToDBStatus(originalVehicle.status);
      
      if (String(formDbStatus).toLowerCase() !== String(originalDbStatus).toLowerCase()) {
        console.log(`Status changed: ${originalDbStatus} -> ${formDbStatus}`);
        return true;
      }
    }
    
    for (const field of fieldsToCompare) {
      if (field === 'license_plate') {
        const originalValue = originalVehicle.license_plate || originalVehicle.licensePlate;
        if (String(formData[field] || '') !== String(originalValue || '')) {
          console.log(`Field '${field}' changed: ${originalValue} -> ${formData[field]}`);
          return true;
        }
      } 
      else if (field === 'description') {
        const originalValue = originalVehicle.description || originalVehicle.notes;
        if (String(formData[field] || '') !== String(originalValue || '')) {
          console.log(`Field '${field}' changed: ${originalValue} -> ${formData[field]}`);
          return true;
        }
      }
      else if (field === 'rent_amount') {
        const originalValue = originalVehicle.rent_amount || originalVehicle.dailyRate;
        if (Number(formData[field] || 0) !== Number(originalValue || 0)) {
          console.log(`Field '${field}' changed: ${originalValue} -> ${formData[field]}`);
          return true;
        }
      }
      else if (formData[field] !== undefined) {
        const formValue = typeof formData[field] === 'string' 
          ? formData[field].trim() 
          : formData[field];
          
        const originalValue = originalVehicle[field];
        
        if (String(formValue || '') !== String(originalValue || '')) {
          console.log(`Field '${field}' changed: ${originalValue} -> ${formValue}`);
          return true;
        }
      }
    }
    
    const formVehicleTypeId = formData.vehicle_type_id === 'none' ? null : formData.vehicle_type_id;
    if (String(formVehicleTypeId || '') !== String(originalVehicle.vehicle_type_id || '')) {
      console.log(`Field 'vehicle_type_id' changed: ${originalVehicle.vehicle_type_id} -> ${formVehicleTypeId}`);
      return true;
    }
    
    console.log('No changes detected in form data');
    return false;
  };
  
  const handleSubmit = async (formData: any) => {
    if (!id) {
      console.error('No vehicle ID provided for update');
      toast.error('Missing vehicle ID', {
        description: 'Cannot update vehicle without an ID'
      });
      return;
    }
    
    console.log('Form submitted with data:', formData);
    
    if (!formData.make || !formData.model || !formData.year || !formData.license_plate || !formData.vin) {
      console.error('Missing required fields in form data:', formData);
      toast.error('Missing required fields', {
        description: 'Please fill in all required fields'
      });
      return;
    }
    
    const connectionStatus = await checkSupabaseHealth();
    if (!connectionStatus.isHealthy) {
      toast.error('Database connection error', {
        description: 'Please check your internet connection and try again.',
        id: 'db-connection-error'
      });
      return;
    }
    
    if (formData.status) {
      formData.status = formData.status.trim();
      console.log(`Status before mapping: "${formData.status}"`);
      
      const dbStatus = mapToDBStatus(formData.status);
      console.log(`Status mapped for submission: "${formData.status}" -> "${dbStatus}"`);
    }
    
    console.log('Status values before hasChanges check:', {
      originalStatus: vehicle?.status,
      formStatus: formData.status,
      databaseOriginalStatus: mapToDBStatus(vehicle?.status),
      databaseFormStatus: mapToDBStatus(formData.status),
    });
    
    if (!hasChanges(formData, vehicle)) {
      console.log('No changes detected, skipping update');
      toast.info('No changes to save', {
        description: 'The vehicle data remains unchanged'
      });
      navigate(`/vehicles/${id}`);
      return;
    }
    
    try {
      if (formData.model && formData.model.toLowerCase().includes('b70') && !formData.image && modelSpecificImage) {
        console.log('Using model-specific B70 image');
      } 
      else if (formData.image) {
        console.log('Image provided, ensuring storage bucket exists');
        const bucketReady = await ensureVehicleImagesBucket();
        if (!bucketReady) {
          console.error('Failed to prepare storage bucket:', bucketError);
          toast.error('Storage bucket issue', { description: bucketError || 'Failed to prepare storage for vehicle images' });
          return;
        }
      }
      
      if (formData.insurance_expiry === '') {
        console.log('Converting empty insurance_expiry to null');
        formData.insurance_expiry = null;
      }
      
      const safeFormData = { ...formData };
      
      if (safeFormData.status) {
        const dbStatus = mapToDBStatus(safeFormData.status);
        console.log(`Final status for submission: "${safeFormData.status}" -> "${dbStatus}"`);
        safeFormData.status = dbStatus;
      }
      
      console.log('Submitting vehicle update with data:', safeFormData);
      
      updateVehicle(
        { id, data: safeFormData },
        {
          onSuccess: (updatedVehicle) => {
            console.log('Vehicle updated successfully:', updatedVehicle);
            toast.success('Vehicle updated successfully');
            navigate(`/vehicles/${id}`);
          },
          onError: (error) => {
            console.error('Update vehicle error:', error);
            toast.error('Failed to update vehicle', {
              description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
            refetch();
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
  
  if (!isConnected) {
    return (
      <PageContainer>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <WifiOff className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Connection Error</h2>
          </div>
          <p>{connectionError || 'Cannot connect to the database. Please check your internet connection.'}</p>
          <CustomButton 
            className="mt-4" 
            variant="outline" 
            onClick={async () => {
              const health = await checkSupabaseHealth();
              if (health.isHealthy) {
                setIsConnected(true);
                setConnectionError(null);
                refetch();
              } else {
                toast.error('Still unable to connect', {
                  description: health.error || 'Please check your internet connection and try again.'
                });
              }
            }}
          >
            Retry Connection
          </CustomButton>
        </div>
      </PageContainer>
    );
  }
  
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
    console.error('Error loading vehicle:', error);
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <AlertOctagon className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Vehicle Not Found</h2>
          </div>
          <p>The vehicle you're trying to edit doesn't exist or has been removed.</p>
          <p className="mt-2 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
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
          <CustomButton 
            size="sm" 
            variant="outline" 
            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </CustomButton>
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
    </PageContainer>
  );
};

export default EditVehicle;
