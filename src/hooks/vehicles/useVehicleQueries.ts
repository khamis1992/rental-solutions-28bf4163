import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  VehicleFilterParams,
  DatabaseVehicleRecord,
} from '@/types/vehicle';
import { CacheManager } from '@/lib/cache-utils';
import { checkSupabaseHealth } from '@/lib/supabase';
import { mapDatabaseRecordToVehicle } from '@/lib/vehicles/vehicle-mappers';
import { handleError } from '@/hooks/use-api';
import { safelyGetRecordsFromResponse } from '@/types/supabase-helpers';

export const useVehicleQueries = () => {
  const queryClient = useQueryClient();

  const useList = (filters?: VehicleFilterParams) => {
    return useQuery({
      queryKey: ['vehicles', filters],
      queryFn: async () => {
        const cacheKey = `vehicles-${JSON.stringify(filters || {})}`;
        try {
          const cachedData = CacheManager.get(cacheKey);
          if (cachedData) {
            return cachedData;
          }
        } catch (error) {
          console.warn('Cache retrieval failed:', error);
        }
        try {
          const { isHealthy, error: connectionError } = await checkSupabaseHealth();
          
          if (!isHealthy) {
            throw new Error(`Database connection error: ${connectionError || 'Failed to connect'}`);
          }
          
          let query = supabase
            .from('vehicles')
            .select('*, vehicle_types(*)')
            .order('created_at', { ascending: false })
            .limit(20);
            
          if (filters?.cursor) {
            query = query.lt('created_at', filters.cursor);
          }
          
          if (filters) {
            if (filters.status) {
              if (filters.status === 'reserved') {
                query = query.eq('status', 'reserve');
              } else {
                query = query.eq('status', filters.status);
              }
            }
            
            if (filters.make) {
              query = query.eq('make', filters.make);
            }
            
            if (filters.model) {
              query = query.ilike('model', `%${filters.model}%`);
            }
            
            if (filters.vehicle_type_id) {
              query = query.eq('vehicle_type_id', filters.vehicle_type_id);
            }
            
            if (filters.location) {
              query = query.eq('location', filters.location);
            }
            
            if (filters.year) {
              query = query.eq('year', filters.year);
            }
            
            if (filters.search) {
              query = query.ilike('vin', `%${filters.search}%`);
            }
          }
          
          let attempts = 0;
          const maxAttempts = 2;
          let lastError = null;
          
          while (attempts < maxAttempts) {
            try {
              const response = await query.order('created_at', { ascending: false });

              if (response.error) {
                lastError = response.error;
                attempts++;
                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  continue;
                }
                throw response.error;
              }

              const safeData = safelyGetRecordsFromResponse<DatabaseVehicleRecord>(
                response as any
              );
              return safeData.map(record =>
                mapDatabaseRecordToVehicle(record)
              );
            } catch (err) {
              lastError = err;
              attempts++;
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                break;
              }
            }
          }
          
          throw lastError;
        } catch (error) {
          console.error('Failed to fetch vehicles:', error);
          handleError(error, { errorContext: 'Failed to fetch vehicles' });
          throw error;
        }
      },
      staleTime: 1000 * 60 * 5,
      retry: 2,
      retryDelay: 1000,
    });
  };

  const useVehicle = (id: string) => {
    return useQuery({
      queryKey: ['vehicles', id],
      queryFn: async () => {
        try {
          if (!id) {
            throw new Error('Vehicle ID is required');
          }
          
          const { isHealthy, error: healthCheckError } = await checkSupabaseHealth();
          if (!isHealthy) {
            throw new Error(`Database connection error: ${healthCheckError || 'Failed to connect'}`);
          }
          
          const { data, error } = await supabase
            .from('vehicles')
            .select('*, vehicle_types(*)')
            .eq('id', id)
            .maybeSingle();
          
          if (error) {
            console.error(`Error fetching vehicle ${id}:`, error);
            throw error;
          }
          
          if (!data) {
            console.error(`No vehicle found with ID: ${id}`);
            throw new Error(`Vehicle with ID ${id} not found`);
          }
          
          const mappedVehicle = mapDatabaseRecordToVehicle(data);
          return mappedVehicle;
        } catch (error) {
          console.error(`Failed to fetch vehicle ${id}:`, error);
          handleError(error, { errorContext: `Failed to fetch vehicle ${id}` });
          throw error;
        }
      },
      enabled: Boolean(id),
      retry: 2,
      retryDelay: 1000,
      staleTime: 1000 * 30,
    });
  };

  const useRealtimeUpdates = () => {
    useEffect(() => {
      const subscription = supabase
        .channel('vehicles-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'vehicles' 
          }, 
          (payload) => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            
            if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
              queryClient.invalidateQueries({ 
                queryKey: ['vehicles', payload.new.id] 
              });
            }
            
            if (payload.eventType === 'UPDATE' && 
                payload.old && payload.new && 
                typeof payload.old === 'object' && typeof payload.new === 'object' &&
                'status' in payload.old && 'status' in payload.new &&
                'make' in payload.new && 'model' in payload.new &&
                payload.old.status !== payload.new.status) {
              toast.info(`Vehicle status updated`, {
                description: `${payload.new.make} ${payload.new.model} is now ${payload.new.status === 'reserve' ? 'reserved' : payload.new.status}`,
              });
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }, [queryClient]);
  };

  return {
    useList,
    useVehicle,
    useRealtimeUpdates,
  };
};
