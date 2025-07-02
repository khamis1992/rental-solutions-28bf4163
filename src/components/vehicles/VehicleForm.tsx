

import { useForm } from 'react-hook-form';
import { Vehicle } from '@/types/vehicle';
import { showErrorToast } from '@/utils/toast-utils';

import { FormProvider } from '@/components/forms/FormProvider';
import { ButtonLoader } from '@/components/ui/loading-spinner';

interface VehicleFormProps {
  initialData?: Partial<Vehicle>;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  isLoading?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  isEditMode = false,
  isLoading = false
}) => {
  const [selectedImage, setSelectedImage] = React.useState(null as File | null);
  
  const form = useForm({
    defaultValues: {
      ...initialData || {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        license_plate: '',
        vin: '',
        status: 'available',
        mileage: 0,
      }
    }
  });

  const handleSubmit = async (formData: any) => {
    try {
      // Handle the file upload correctly
      const dataToSubmit = {
        ...formData
      };
      
      // If there's a selected image, handle it separately
      if (selectedImage) {
        // Add the image to the submitted data
        dataToSubmit.image = selectedImage;
        console.log("Image selected:", selectedImage.name);
      }
      
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
      showErrorToast(error, 'Vehicle Form Error');
    }
  };

  return (
    <FormProvider form={form} onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields */}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Vehicle Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setSelectedImage(e.target.files[0]);
            }
          }}
          className="w-full"
        />
        {initialData && initialData.image_url && !selectedImage && (
          <div className="mt-2">
            <p>Current image: {initialData.image_url}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">Cancel</Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? (
            <ButtonLoader text={isEditMode ? 'Updating...' : 'Saving...'} />
          ) : (
            isEditMode ? 'Update Vehicle' : 'Save Vehicle'
          )}
        </Button>
      </div>
    </FormProvider>
  );
};

export default VehicleForm;
