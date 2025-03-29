import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

class NotificationService {
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async scheduleNotification(title: string, body: string, trigger = null) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: trigger || null,
    });
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async subscribeToUpdates() {
    // Subscribe to various real-time updates
    const maintenanceSubscription = supabase
      .channel('maintenance_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance_records'
      }, async (payload) => {
        await this.scheduleNotification('Maintenance Update',
          `Maintenance record ${payload.eventType}: ${payload.new?.description}`);
      })
      .subscribe();

    const agreementSubscription = supabase
      .channel('agreement_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agreements'
      }, async (payload) => {
        await this.scheduleNotification('Agreement Update',
          `Agreement ${payload.eventType}: ${payload.new?.agreement_number}`);
      })
      .subscribe();

    return [maintenanceSubscription, agreementSubscription];
  }
}