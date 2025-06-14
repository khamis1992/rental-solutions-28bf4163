import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { Bell, Save } from 'lucide-react';

interface NotificationSettingsProps {
  initialData?: Record<string, any>;
}

const NotificationSettings = ({ initialData }: NotificationSettingsProps) => {
  const queryClient = useQueryClient();
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: initialData?.email_notifications ?? true,
    system_notifications: initialData?.system_notifications ?? true,
    maintenance_reminders: initialData?.maintenance_reminders ?? true,
    payment_reminders: initialData?.payment_reminders ?? true,
    report_notifications: initialData?.report_notifications ?? true,
    document_expiration: initialData?.document_expiration ?? true,
    customer_activity: initialData?.customer_activity ?? false,
    vehicle_alerts: initialData?.vehicle_alerts ?? true,
    financial_alerts: initialData?.financial_alerts ?? true,
    legal_notifications: initialData?.legal_notifications ?? true,
  });
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Save notification settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      // Process each setting individually
      for (const [key, value] of Object.entries(data)) {
        // Use a more generic approach for inserting data
        const { error } = await supabase
          .from('system_settings')
          .upsert({ 
            id: initialData?.[key]?.id || undefined,
            setting_key: key, 
            setting_value: value 
          }, {
            onConflict: 'setting_key'
          });
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success("Your notification preferences have been updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to save notification settings");
      console.error("Error saving notification settings:", error);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(notificationSettings);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Notification Settings</CardTitle>
        </div>
        <CardDescription>
          Manage your notification preferences and alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Communication Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="email_notifications" className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch 
                  id="email_notifications" 
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={(checked) => handleSwitchChange('email_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="system_notifications" className="font-medium">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
                </div>
                <Switch 
                  id="system_notifications" 
                  checked={notificationSettings.system_notifications}
                  onCheckedChange={(checked) => handleSwitchChange('system_notifications', checked)}
                />
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <h3 className="font-medium">Notification Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="maintenance_reminders" className="font-medium">Maintenance Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified about scheduled maintenance</p>
                </div>
                <Switch 
                  id="maintenance_reminders" 
                  checked={notificationSettings.maintenance_reminders}
                  onCheckedChange={(checked) => handleSwitchChange('maintenance_reminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="payment_reminders" className="font-medium">Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming and overdue payments</p>
                </div>
                <Switch 
                  id="payment_reminders" 
                  checked={notificationSettings.payment_reminders}
                  onCheckedChange={(checked) => handleSwitchChange('payment_reminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="report_notifications" className="font-medium">Report Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when reports are generated</p>
                </div>
                <Switch 
                  id="report_notifications" 
                  checked={notificationSettings.report_notifications}
                  onCheckedChange={(checked) => handleSwitchChange('report_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="document_expiration" className="font-medium">Document Expiration</Label>
                  <p className="text-sm text-muted-foreground">Get notified about expiring documents</p>
                </div>
                <Switch 
                  id="document_expiration" 
                  checked={notificationSettings.document_expiration}
                  onCheckedChange={(checked) => handleSwitchChange('document_expiration', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="customer_activity" className="font-medium">Customer Activity</Label>
                  <p className="text-sm text-muted-foreground">Get notified about customer interactions</p>
                </div>
                <Switch 
                  id="customer_activity" 
                  checked={notificationSettings.customer_activity}
                  onCheckedChange={(checked) => handleSwitchChange('customer_activity', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="vehicle_alerts" className="font-medium">Vehicle Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about vehicle status changes</p>
                </div>
                <Switch 
                  id="vehicle_alerts" 
                  checked={notificationSettings.vehicle_alerts}
                  onCheckedChange={(checked) => handleSwitchChange('vehicle_alerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="financial_alerts" className="font-medium">Financial Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about financial events</p>
                </div>
                <Switch 
                  id="financial_alerts" 
                  checked={notificationSettings.financial_alerts}
                  onCheckedChange={(checked) => handleSwitchChange('financial_alerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="legal_notifications" className="font-medium">Legal Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified about legal matters</p>
                </div>
                <Switch 
                  id="legal_notifications" 
                  checked={notificationSettings.legal_notifications}
                  onCheckedChange={(checked) => handleSwitchChange('legal_notifications', checked)}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={saveSettingsMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
