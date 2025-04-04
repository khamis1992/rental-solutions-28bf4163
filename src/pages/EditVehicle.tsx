
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
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { getDirectionalClasses } from '@/utils/rtl-utils';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [modelSpecificImage, setModelSpecificImage] = useState<string | null>(null);
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  const { useVehicle, useUpdate } = useVehicles();
  const { data: vehicle, isLoading, error, refetch } = useVehicle(id || '');
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdate();
  
  useEffect(() => {
    if (!id) {
      console.error('No vehicle ID provided in URL');
      toast.error(t('common.error'), {
        description: t('vehicles.noIdProvided')
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
  }, [vehicle, id, t]);
  
  // Check if bucket exists and create it if needed
  const ensureVehicleImagesBucket = async () => {
    try {
      console.log('Ensuring vehicle-images bucket exists');
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        setBucketError(`${t('common.error')}: ${listError.message}`);
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
          setBucketError(`${t('common.error')}: ${createError.message}`);
          return false;
        }
        
        console.log('Storage bucket created successfully');
        toast.success(t('vehicles.bucketCreatedSuccess'));
      } else {
        console.log('vehicle-images bucket already exists');
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring vehicle images bucket exists:', error);
      setBucketError(`${t('common.unexpectedError')}: ${error instanceof Error ? error.message : t('common.unknownError')}`);
      return false;
    }
  };
  
  const handleSubmit = async (formData: any) => {
    if (!id) {
      console.error('No vehicle ID provided for update');
      toast.error(t('common.error'), {
        description: t('vehicles.missingId')
      });
      return;
    }
    
    console.log('Form submitted with data:', formData);
    
    // Validate required fields
    if (!formData.make || !formData.model || !formData.year || !formData.license_plate || !formData.vin) {
      console.error('Missing required fields in form data:', formData);
      toast.error(t('common.error'), {
        description: t('common.requiredFields')
      });
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
          toast.error(t('common.error'), { description: bucketError || t('vehicles.bucketPrepareFailed') });
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
            toast.success(t('vehicles.updateSuccess'));
            navigate(`/vehicles/${id}`);
          },
          onError: (error) => {
            console.error('Update vehicle error:', error);
            toast.error(t('vehicles.updateFailed'), {
              description: error instanceof Error ? error.message : t('common.unknownError'),
            });
            // Try to refetch the vehicle data to ensure our UI is in sync
            refetch();
          }
        }
      );
    } catch (error) {
      console.error('Edit vehicle submission error:', error);
      toast.error(t('common.formSubmitError'), {
        description: error instanceof Error ? error.message : t('common.unexpectedError')
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
            <h2 className="text-xl font-semibold">{t('vehicles.notFound')}</h2>
          </div>
          <p>{t('vehicles.removedOrDoesNotExist')}</p>
          <p className="mt-2 text-sm">{error instanceof Error ? error.message : t('common.unknownError')}</p>
          <CustomButton 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('vehicles.returnToVehicles')}
          </CustomButton>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <SectionHeader
        title={`${t('vehicles.edit')}: ${vehicle.make} ${vehicle.model}`}
        description={`${vehicle.year} • ${vehicle.licensePlate}`}
        icon={Car}
        actions={
          <CustomButton 
            size="sm" 
            variant="outline" 
            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.back')} {t('common.to')} {t('vehicles.details')}
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
