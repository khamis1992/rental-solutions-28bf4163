import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Test the database connection by fetching a small amount of data
 * @returns Promise with connection status and data count
 */
export const testDatabaseConnection = async (): Promise<{ 
  success: boolean; 
  message: string;
  data?: any;
}> => {
  try {
    console.log('Testing database connection...');
    
    // Try to fetch a single row from the leases table
    const { data, error } = await supabase
      .from('leases')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
    
    // Try to fetch a single row from the profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('Profiles table query failed:', profilesError);
      return {
        success: false,
        message: `Profiles query failed: ${profilesError.message}`
      };
    }
    
    return {
      success: true,
      message: `Connection successful. Found ${data?.length || 0} leases and ${profilesData?.length || 0} profiles.`,
      data: {
        leases: data,
        profiles: profilesData
      }
    };
  } catch (error) {
    console.error('Unexpected error in database connection test:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Run the database connection test and show a toast with the result
 */
export const runDatabaseConnectionTest = async (): Promise<void> => {
  const result = await testDatabaseConnection();
  
  if (result.success) {
    toast.success('Database connection test passed', {
      description: result.message
    });
  } else {
    toast.error('Database connection test failed', {
      description: result.message
    });
  }
  
  console.log('Database connection test result:', result);
  return result;
};
