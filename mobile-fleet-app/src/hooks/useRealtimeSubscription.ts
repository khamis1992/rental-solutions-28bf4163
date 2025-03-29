
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeSubscription() {
  useEffect(() => {
    const agreementsSubscription = supabase
      .channel('agreements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agreements' }, 
        payload => {
          console.log('Agreement change:', payload);
        }
      )
      .subscribe();

    const vehiclesSubscription = supabase
      .channel('vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' },
        payload => {
          console.log('Vehicle change:', payload);
        }
      )
      .subscribe();

    const maintenanceSubscription = supabase
      .channel('maintenance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance' },
        payload => {
          console.log('Maintenance change:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agreementsSubscription);
      supabase.removeChannel(vehiclesSubscription);
      supabase.removeChannel(maintenanceSubscription);
    };
  }, []);
}
