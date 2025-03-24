
import { supabase } from '@/integrations/supabase/client';

// Ensure the vehicle-images bucket exists
export async function ensureVehicleImagesBucket(): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'vehicle-images');
    
    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage
        .createBucket('vehicle-images', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring vehicle images bucket exists:', error);
    return false;
  }
}

// Get public URL for an image
export function getImagePublicUrl(bucket: string, path: string): string {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return '';
  }
}

// Upload a vehicle image
export async function uploadVehicleImage(file: File, id: string): Promise<string> {
  const bucketReady = await ensureVehicleImagesBucket();
  
  if (!bucketReady) {
    throw new Error('Failed to ensure vehicle-images bucket exists. Please contact an administrator.');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${id}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  const { error } = await supabase.storage
    .from('vehicle-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) {
    console.error('Upload error details:', error);
    throw new Error(`Error uploading image: ${error.message}`);
  }
  
  return getImagePublicUrl('vehicle-images', filePath);
}
