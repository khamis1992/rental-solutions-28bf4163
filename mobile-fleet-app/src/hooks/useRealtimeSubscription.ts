
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeSubscription = (table: string, onUpdate: (payload: any) => void) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => onUpdate(payload)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, onUpdate]);
};
