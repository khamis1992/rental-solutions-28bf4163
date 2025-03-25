
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
  
  // Get the public URL for the uploaded image
  return getImagePublicUrl('vehicle-images', filePath);
}

// List all vehicle images in the bucket
export async function listVehicleImages(): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('vehicle-images')
      .list();
    
    if (error) {
      console.error('Error listing vehicle images:', error);
      return [];
    }
    
    return data
      .filter(item => !item.id.endsWith('/')) // Filter out folders
      .map(item => getImagePublicUrl('vehicle-images', item.name));
  } catch (error) {
    console.error('Error listing vehicle images:', error);
    return [];
  }
}

// Get vehicle image by ID (useful for finding a specific vehicle's image)
export async function getVehicleImageByPrefix(idPrefix: string): Promise<string | null> {
  if (!idPrefix) return null;
  
  try {
    const { data, error } = await supabase.storage
      .from('vehicle-images')
      .list();
    
    if (error) {
      console.error('Error searching for vehicle image:', error);
      return null;
    }
    
    // Find files that start with the vehicle ID
    const vehicleImages = data.filter(item => item.name.startsWith(idPrefix));
    
    if (vehicleImages.length === 0) return null;
    
    // Return the most recent image (if there are multiple)
    const sortedImages = vehicleImages.sort((a, b) => {
      const aTimestamp = parseInt(a.name.split('-')[1]?.split('.')[0] || '0');
      const bTimestamp = parseInt(b.name.split('-')[1]?.split('.')[0] || '0');
      return bTimestamp - aTimestamp;
    });
    
    return getImagePublicUrl('vehicle-images', sortedImages[0].name);
  } catch (error) {
    console.error('Error getting vehicle image by ID:', error);
    return null;
  }
}

// Get specific model image from storage (for B70 or other models)
export async function getModelSpecificImage(model: string): Promise<string | null> {
  const modelLower = (model || '').toString().toLowerCase().trim();
  
  // For now, we only implement this for B70 specifically
  if (modelLower.includes('b70') || modelLower === 'b70') {
    try {
      // Query the storage for any files with 'b70' in the name
      const { data, error } = await supabase.storage
        .from('vehicle-images')
        .list('', {
          search: 'b70'
        });
      
      if (error) {
        console.error('Error searching for B70 image:', error);
        return null;
      }
      
      // Find B70 specific images
      const b70Images = data.filter(item => 
        item.name.toLowerCase().includes('b70') && 
        !item.name.includes('-') // Exclude vehicle-specific images that contain hyphens
      );
      
      if (b70Images.length > 0) {
        return getImagePublicUrl('vehicle-images', b70Images[0].name);
      }
      
      // Fallback to the public image if not in storage
      return '/lovable-uploads/977480e0-3193-4751-b9d0-8172d78e42e5.png';
    } catch (error) {
      console.error('Error getting B70 model image:', error);
      return null;
    }
  }
  
  return null;
}
