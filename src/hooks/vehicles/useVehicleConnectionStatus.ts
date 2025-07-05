import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { checkSupabaseHealth, checkConnectionWithRetry } from '@/lib/supabase';

export const useVehicleConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  const checkConnection = useCallback(async () => {
    const isConnected = await checkConnectionWithRetry();
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    
    if (!isConnected) {
      toast.error('Database connection error', {
        description: 'Failed to connect to the database. Check your internet connection.',
        duration: 5000,
      });
    }
  }, []); // Empty dependency array since checkConnectionWithRetry is stable
  
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const { data: isHealthy } = useQuery({
    queryKey: ['databaseConnection'],
    queryFn: async () => {
      const result = await checkSupabaseHealth();
      return result.isHealthy;
    },
    refetchInterval: 30000,
  });

  return {
    connectionStatus,
    isHealthy,
  };
};
