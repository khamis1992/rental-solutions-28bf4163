import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface NotificationSettingsProps {
  // Define any props here
}

const NotificationSettings: React.FC<NotificationSettingsProps> = () => {
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Fetch settings from the database
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('setting_key', 'email_notifications')
          .single();

        if (error) {
          console.error('Error fetching settings:', error);
        } else {
          // Set the initial state based on the fetched settings
          setEmailNotifications(data?.setting_value === true);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
      // Check if the setting already exists
      const { data: existingSetting } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', key)
        .single();
      
      if (existingSetting) {
        // Update existing setting
        const { data, error } = await supabase
          .from('system_settings')
          .update({
            setting_value: value
          })
          .eq('setting_key', key);
          
        if (error) throw error;
      } else {
        // Insert new setting with proper types
        const { data, error } = await supabase
          .from('system_settings')
          .insert([{
            setting_key: key, 
            setting_value: value
          }]);
          
        if (error) throw error;
      }
      
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const handleEmailNotificationsChange = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await updateSetting('email_notifications', checked);
      setEmailNotifications(checked);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushNotificationsChange = async (checked: boolean) => {
    setIsLoading(true);
    try {
      // In a real application, you would also handle push notification settings
      // For now, we'll just show a toast message
      toast.info('Push notification settings are not yet implemented');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how you receive updates and notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications">Email Notifications</Label>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={handleEmailNotificationsChange}
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notifications">Push Notifications</Label>
          <Switch
            id="push-notifications"
            checked={pushNotifications}
            onCheckedChange={handlePushNotificationsChange}
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
