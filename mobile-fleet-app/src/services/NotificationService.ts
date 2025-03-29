import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export class NotificationService {
  static async registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token;
  }

  static async savePushToken(userId: string, token: string) {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ user_id: userId, token });

    if (error) throw error;
  }

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