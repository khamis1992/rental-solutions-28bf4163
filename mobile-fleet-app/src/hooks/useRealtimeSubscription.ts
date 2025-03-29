import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NotificationService } from '../services/NotificationService';

export const useRealtimeSubscription = () => {
  useEffect(() => {
    const setupSubscriptions = async () => {
      const subscriptions = await NotificationService.subscribeToUpdates();

      return () => {
        subscriptions.forEach(subscription => {
          if (subscription && subscription.unsubscribe) {
            subscription.unsubscribe();
          }
        });
      };
    };

    setupSubscriptions();
  }, []);
};