
import React, { useState } from 'react';
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

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bucketError, setBucketError] = useState<string | null>(null);
  
  const { useVehicle, useUpdate } = useVehicles();
  const { data: vehicle, isLoading, error } = useVehicle(id || '');
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdate();
  
  // Check if bucket exists and create it if needed
  const ensureVehicleImagesBucket = async () => {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        setBucketError(`Error checking storage buckets: ${listError.message}`);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'vehicle-images');
      
      if (!bucketExists) {
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
        
        toast.success('Vehicle images storage bucket created successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring vehicle images bucket exists:', error);
      setBucketError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  const handleSubmit = async (formData: any) => {
    if (id) {
      // If there's an image, ensure the bucket exists first
      if (formData.image) {
        const bucketReady = await ensureVehicleImagesBucket();
        if (!bucketReady) {
          toast.error('Storage bucket issue', { description: bucketError || 'Failed to prepare storage for vehicle images' });
          return;
        }
      }
      
      updateVehicle(
        { id, data: formData },
        {
          onSuccess: () => {
            navigate(`/vehicles/${id}`);
          },
          onError: (error) => {
            toast.error('Failed to update vehicle', {
              description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
          }
        }
      );
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
          <div className="flex items-center mb-4">
            <AlertOctagon className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Vehicle Not Found</h2>
          </div>
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
