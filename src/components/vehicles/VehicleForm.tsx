
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Vehicle } from '@/types/vehicle';

// Fix the error with instanceof File check
interface VehicleFormProps {
  initialData?: Partial<Vehicle>;
  onSubmit: (data: any) => void;
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
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
    }
  };

  // Fix the image upload handling
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
        <button type="button" className="px-4 py-2 border rounded-md">Cancel</button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Vehicle' : 'Save Vehicle'}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;
