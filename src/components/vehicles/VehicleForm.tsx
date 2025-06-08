
import React from 'react';
import { useForm } from 'react-hook-form';
import { Vehicle } from '@/types/vehicle';
import { showErrorToast } from '@/utils/toast-utils';
import { Button } from '@/components/ui/button';
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
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  
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
      {/* Basic vehicle fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Make</label>
          <input
            {...form.register('make')}
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Vehicle make"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            {...form.register('model')}
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Vehicle model"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            {...form.register('year', { valueAsNumber: true })}
            type="number"
            className="w-full border rounded px-3 py-2"
            placeholder="Year"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <input
            {...form.register('color')}
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Vehicle color"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">License Plate</label>
          <input
            {...form.register('license_plate')}
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="License plate"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">VIN</label>
          <input
            {...form.register('vin')}
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Vehicle identification number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            {...form.register('status')}
            className="w-full border rounded px-3 py-2"
          >
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mileage</label>
          <input
            {...form.register('mileage', { valueAsNumber: true })}
            type="number"
            className="w-full border rounded px-3 py-2"
            placeholder="Current mileage"
          />
        </div>
      </div>
      
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
