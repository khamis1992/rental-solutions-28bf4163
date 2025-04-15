
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface VehicleImageUploadProps {
  vehicleId?: string;
  onComplete?: (url: string) => void;
  onUpload?: (url: string) => void;
  onImageSelected?: (file: File | null) => void;
  initialImageUrl?: string;
}

const VehicleImageUpload: React.FC<VehicleImageUploadProps> = ({ 
  vehicleId, 
  onComplete, 
  onUpload, 
  onImageSelected,
  initialImageUrl 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // If onImageSelected is provided, call it with the selected file
    if (onImageSelected) {
      onImageSelected(file);
      
      // Create a local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `vehicles/${vehicleId || 'new'}/${fileName}`;
      
      // Upload the file
      const { data, error: uploadError } = await supabase
        .storage
        .from('vehicle_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
        
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      // Get the public URL
      const { data: urlData } = supabase
        .storage
        .from('vehicle_images')
        .getPublicUrl(filePath);
        
      const publicUrl = urlData.publicUrl;
      
      if (onUpload) {
        onUpload(publicUrl);
      }
      
      if (onComplete) {
        onComplete(publicUrl);
      }
      
      setPreviewUrl(publicUrl);
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl && (
        <div className="mt-4">
          <img 
            src={previewUrl} 
            alt="Vehicle preview" 
            className="max-h-64 rounded-md mx-auto"
          />
        </div>
      )}
      
      <div className="flex items-center justify-center w-full">
        <label htmlFor="vehicle-image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG or JPG (MAX. 5MB)
            </p>
          </div>
          <Input
            id="vehicle-image-upload"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          <p className="text-sm text-center mt-1">Uploading... {uploadProgress}%</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
};

export default VehicleImageUpload;
