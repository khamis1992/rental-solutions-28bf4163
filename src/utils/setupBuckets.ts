
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
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating agreements bucket:', createError);
        return false;
      }
      
      console.log('Agreements bucket created successfully');
      
      // Set up public access policy for the bucket
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: 'agreements',
        policy_name: 'public_access',
        definition: `bucket_id = 'agreements'`
      });
      
      if (policyError) {
        console.error('Error setting up bucket policy, but bucket was created:', policyError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring storage buckets exist:', error);
    return false;
  }
};
