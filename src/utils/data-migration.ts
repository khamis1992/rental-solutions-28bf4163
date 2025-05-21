import { supabase } from '../lib/supabase';

/**
 * Utility to detect if mock data should be used based on configuration
 * and connection status
 */
export const shouldUseMockData = async (): Promise<boolean> => {
  const isDev = import.meta.env.DEV;
  
  try {
    const { data, error } = await supabase.from('vehicles').select('count', {
      count: 'exact',
      head: true,
    });
    
    const hasConnection = !error;
    
    return isDev && !hasConnection;
  } catch (error) {
    console.warn('Error checking Supabase connection, falling back to mock data', error);
    return true;
  }
};

/**
 * Helper to get either mock data or real data based on connection status
 */
export const getDataSource = async <T>(
  mockData: T, 
  realDataFn: () => Promise<T>
): Promise<T> => {
  return (await shouldUseMockData()) ? mockData : await realDataFn();
};
