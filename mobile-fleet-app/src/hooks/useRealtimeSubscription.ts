
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeSubscription(table: string, filter?: any) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const subscription = supabase
      .channel('public:' + table)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        // Handle different types of changes
        switch (payload.eventType) {
          case 'INSERT':
            setData((current) => [...current, payload.new]);
            break;
          case 'UPDATE':
            setData((current) =>
              current.map((item) => (item.id === payload.new.id ? payload.new : item))
            );
            break;
          case 'DELETE':
            setData((current) => current.filter((item) => item.id !== payload.old.id));
            break;
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table]);

  return data;
}
