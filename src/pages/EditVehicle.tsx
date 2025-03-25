
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
import { ensureVehicleImagesBucket } from '@/lib/vehicles/vehicle-storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [checkingBucket, setCheckingBucket] = useState(false);
  
  const { useVehicle, useUpdate } = useVehicles();
  const { data: vehicle, isLoading, error } = useVehicle(id || '');
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdate();
  
  // Check if bucket exists and create it if needed
  const checkVehicleImagesBucket = async () => {
    try {
      setCheckingBucket(true);
      const bucketReady = await ensureVehicleImagesBucket();
      
      if (!bucketReady) {
        setBucketError('Failed to prepare storage for vehicle images. Check your Supabase configuration.');
        toast.error('Storage bucket issue', { 
          description: 'Failed to prepare storage for vehicle images. Check your Supabase configuration.'
        });
        setCheckingBucket(false);
        return false;
      }
      
      setBucketError(null);
      setCheckingBucket(false);
      return true;
    } catch (error) {
      console.error('Error ensuring vehicle images bucket exists:', error);
      setBucketError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Storage error', {
        description: error instanceof Error ? error.message : 'Unknown error checking storage'
      });
      setCheckingBucket(false);
      return false;
    }
  };
  
  const handleSubmit = async (formData: any) => {
    if (id) {
      // If there's an image, ensure the bucket exists first
      if (formData.image) {
        const bucketReady = await checkVehicleImagesBucket();
        if (!bucketReady) {
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
      
      {bucketError && (
        <Alert variant="destructive" className="mb-4">
          <AlertOctagon className="h-4 w-4" />
          <AlertTitle>Storage Configuration Error</AlertTitle>
          <AlertDescription>
            <p>{bucketError}</p>
            <p className="text-sm mt-2">
              Please check your Supabase configuration and ensure that the VITE_SUPABASE_SERVICE_ROLE_KEY 
              is properly set in your .env file.
            </p>
            <div className="mt-3">
              <CustomButton
                type="button"
                size="sm"
                variant="outline"
                onClick={checkVehicleImagesBucket}
                disabled={checkingBucket}
              >
                {checkingBucket && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Retry Storage Configuration
              </CustomButton>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="section-transition">
        <VehicleForm 
          initialData={vehicle}
          onSubmit={handleSubmit} 
          isLoading={isUpdating || checkingBucket}
          isEditMode={true}
        />
      </div>
    </PageContainer>
  );
};

export default EditVehicle;
