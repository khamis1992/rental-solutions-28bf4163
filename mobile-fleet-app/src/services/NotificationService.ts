
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export class NotificationService {
  static async initialize() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return true;
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
        await this.showNotification('Maintenance Update', 
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
        await this.showNotification('Agreement Update',
          `Agreement ${payload.eventType}: ${payload.new?.agreement_number}`);
      })
      .subscribe();

    return [maintenanceSubscription, agreementSubscription];
  }

  static async showNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null,
    });
  }
}
