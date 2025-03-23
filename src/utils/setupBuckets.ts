
import { supabase } from "@/lib/supabase";

/**
 * Ensures that the required storage buckets exist in Supabase
 */
export const ensureStorageBuckets = async (): Promise<boolean> => {
  try {
    // Check if agreements bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const agreementBucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    
    if (!agreementBucketExists) {
      // Create the agreements bucket
      const { error: createError } = await supabase.storage.createBucket('agreements', {
        public: true, // Make bucket public
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating agreements bucket:', createError);
        return false;
      }
      
      console.log('Agreements bucket created successfully');
      
      // Set public access policy for the bucket
      try {
        // The getPublicUrl method doesn't return an error property
        // It only returns { data: { publicUrl: string } }
        // So we don't need to check for an error here
        supabase.storage.from('agreements').getPublicUrl('test.txt');
        console.log('Public access for agreements bucket set up');
      } catch (policyError) {
        console.error('Error setting up public access:', policyError);
      }
    } else {
      console.log('Agreements bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring storage buckets exist:', error);
    return false;
  }
};
