
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Car, ArrowLeft, AlertOctagon, Loader2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleForm from '@/components/vehicles/VehicleForm';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getModelSpecificImage } from '@/lib/vehicles/vehicle-storage';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [modelSpecificImage, setModelSpecificImage] = useState<string | null>(null);
  
  const { useVehicle, useUpdate } = useVehicles();
  const { data: vehicle, isLoading, error, refetch } = useVehicle(id || '');
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdate();
  
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
  
  // Check if bucket exists and create it if needed
  const ensureVehicleImagesBucket = async () => {
    try {
      console.log('Ensuring vehicle-images bucket exists');
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        setBucketError(`Error checking storage buckets: ${listError.message}`);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'vehicle-images');
      
      if (!bucketExists) {
        console.log('Creating vehicle-images bucket');
        // Create the bucket
        const { error: createError } = await supabase.storage.createBucket('vehicle-images', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
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
  
  // Helper function to check if the form data differs from the original vehicle data
  const hasChanges = (formData: any, originalVehicle: any) => {
    if (!originalVehicle) return true;
    
    // Check if an image was added
    if (formData.image) return true;
    
    // Compare primitive fields
    const fieldsToCompare = [
      'make', 'model', 'year', 'license_plate', 'vin', 'color', 
      'status', 'mileage', 'location', 'description', 'insurance_company', 
      'insurance_expiry', 'rent_amount'
    ];
    
    for (const field of fieldsToCompare) {
      // Handle special case for license_plate which might be stored as licensePlate
      if (field === 'license_plate') {
        const originalValue = originalVehicle.license_plate || originalVehicle.licensePlate;
        if (String(formData[field] || '') !== String(originalValue || '')) {
          console.log(`Field '${field}' changed: ${originalValue} -> ${formData[field]}`);
          return true;
        }
      } 
      // Special case for description/notes field
      else if (field === 'description') {
        const originalValue = originalVehicle.description || originalVehicle.notes;
        if (String(formData[field] || '') !== String(originalValue || '')) {
          console.log(`Field '${field}' changed: ${originalValue} -> ${formData[field]}`);
          return true;
        }
      }
      // Special case for rent_amount/dailyRate field
      else if (field === 'rent_amount') {
        const originalValue = originalVehicle.rent_amount || originalVehicle.dailyRate;
        if (Number(formData[field] || 0) !== Number(originalValue || 0)) {
          console.log(`Field '${field}' changed: ${originalValue} -> ${formData[field]}`);
          return true;
        }
      }
      // For all other fields
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
    
    // Check vehicle_type_id separately as it has special handling
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
    
    // Validate required fields
    if (!formData.make || !formData.model || !formData.year || !formData.license_plate || !formData.vin) {
      console.error('Missing required fields in form data:', formData);
      toast.error('Missing required fields', {
        description: 'Please fill in all required fields'
      });
      return;
    }
    
    // Check if there are any changes to save
    if (!hasChanges(formData, vehicle)) {
      console.log('No changes detected, skipping update');
      toast.info('No changes to save', {
        description: 'The vehicle data remains unchanged'
      });
      navigate(`/vehicles/${id}`);
      return;
    }
    
    try {
      // For B70 vehicles, if there's no specific image uploaded, we can use the model-specific one
      if (formData.model && formData.model.toLowerCase().includes('b70') && !formData.image && modelSpecificImage) {
        // We don't need to upload an image, as we'll use the model-specific one
        console.log('Using model-specific B70 image');
      } 
      // If there's an image, ensure the bucket exists first
      else if (formData.image) {
        console.log('Image provided, ensuring storage bucket exists');
        const bucketReady = await ensureVehicleImagesBucket();
        if (!bucketReady) {
          console.error('Failed to prepare storage bucket:', bucketError);
          toast.error('Storage bucket issue', { description: bucketError || 'Failed to prepare storage for vehicle images' });
          return;
        }
      }
      
      // Process insurance_expiry to handle empty string (convert to null for the database)
      if (formData.insurance_expiry === '') {
        console.log('Converting empty insurance_expiry to null');
        formData.insurance_expiry = null;
      }
      
      // Make a safe copy of formData that won't cause type issues
      const safeFormData = { ...formData };
      
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
            // Try to refetch the vehicle data to ensure our UI is in sync
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
