import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    await AsyncStorage.setItem('pushToken', token.data);
    return token.data;
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