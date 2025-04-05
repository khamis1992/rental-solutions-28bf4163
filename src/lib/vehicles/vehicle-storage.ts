
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a vehicle image to Supabase storage
 * @param file The file to upload
 * @param bucket Optional bucket name, defaults to 'vehicle_images'
 * @returns Object with URL of uploaded image or error
 */
export const uploadVehicleImage = async (file: File, bucket: string = 'vehicle_images') => {
  try {
    if (!file) {
      console.warn('No file provided for upload');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload the file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { error: uploadError };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    
    if (!publicUrl) {
      console.error('Failed to generate public URL');
      return { error: new Error('Failed to generate public URL') };
    }

    return { url: publicUrl };
  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    return { error };
  }
};
