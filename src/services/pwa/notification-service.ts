import { supabase } from '@/integrations/supabase/client';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || '';

  private constructor() {
    this.permission = Notification.permission;
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await this.requestPermission();

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });

        // Save subscription to backend
        await this.saveSubscription(subscription);
      }

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription(subscription);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    const currentPermission = await this.requestPermission();
    if (currentPermission !== 'granted') {
      console.warn('Cannot show notification: permission denied');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        actions: options.actions as any || [],
        vibrate: [200, 100, 200]
      } as any);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Notification templates for different scenarios
  async notifyPaymentDue(agreementId: string, customerName: string, amount: number): Promise<void> {
    await this.showNotification({
      title: 'Payment Due Reminder',
      body: `Payment of ${amount} QAR is due for ${customerName}`,
      tag: `payment-${agreementId}`,
      data: { 
        type: 'payment-due',
        agreementId,
        url: `/payments?agreement=${agreementId}`
      },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'remind-later', title: 'Remind Later' }
      ],
      requireInteraction: true
    });
  }

  async notifyMaintenanceDue(vehicleId: string, vehiclePlate: string, maintenanceType: string): Promise<void> {
    await this.showNotification({
      title: 'Vehicle Maintenance Due',
      body: `${maintenanceType} maintenance is due for vehicle ${vehiclePlate}`,
      tag: `maintenance-${vehicleId}`,
      data: {
        type: 'maintenance-due',
        vehicleId,
        url: `/vehicles/${vehicleId}`
      },
      actions: [
        { action: 'schedule', title: 'Schedule Now' },
        { action: 'snooze', title: 'Snooze' }
      ]
    });
  }

  async notifyAgreementExpiring(agreementId: string, customerName: string, daysLeft: number): Promise<void> {
    await this.showNotification({
      title: 'Agreement Expiring Soon',
      body: `Agreement with ${customerName} expires in ${daysLeft} days`,
      tag: `agreement-expiry-${agreementId}`,
      data: {
        type: 'agreement-expiring',
        agreementId,
        url: `/agreements/${agreementId}`
      },
      actions: [
        { action: 'renew', title: 'Renew Agreement' },
        { action: 'view', title: 'View Details' }
      ]
    });
  }

  async notifyNewTrafficFine(vehicleId: string, vehiclePlate: string, fineAmount: number): Promise<void> {
    await this.showNotification({
      title: 'New Traffic Fine',
      body: `New traffic fine of ${fineAmount} QAR for vehicle ${vehiclePlate}`,
      tag: `traffic-fine-${vehicleId}`,
      data: {
        type: 'traffic-fine',
        vehicleId,
        url: `/traffic-fines?vehicle=${vehicleId}`
      },
      actions: [
        { action: 'view', title: 'View Fine' },
        { action: 'pay', title: 'Pay Now' }
      ],
      requireInteraction: true
    });
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          keys: JSON.stringify(subscription.toJSON()),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }

  private async removeSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);
    } catch (error) {
      console.error('Error removing push subscription:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();