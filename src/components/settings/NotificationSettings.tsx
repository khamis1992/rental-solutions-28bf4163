// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { Bell, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationSettingsProps {
  initialData?: Record<string, any>;
}

const NotificationSettings = ({ initialData }: NotificationSettingsProps) => {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  
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
      toast.success("تم تحديث تفضيلات الإشعارات بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في حفظ إعدادات الإشعارات");
      console.error("Error saving notification settings:", error);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(notificationSettings);
  };

  return (
    <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <div className="flex items-center gap-2 flex-row-reverse">
          <CardTitle className="text-right">إعدادات الإشعارات</CardTitle>
          <Bell className="h-5 w-5" />
        </div>
        <CardDescription className="text-right">
          إدارة تفضيلات الإشعارات والتنبيهات الخاصة بك
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium text-right">قنوات التواصل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="email_notifications" 
                  checked={notificationSettings.email_notifications}
                  onCheckedChange={(checked) => handleSwitchChange('email_notifications', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="email_notifications" className="font-medium text-right">إشعارات البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي الإشعارات عبر البريد الإلكتروني</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="system_notifications" 
                  checked={notificationSettings.system_notifications}
                  onCheckedChange={(checked) => handleSwitchChange('system_notifications', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="system_notifications" className="font-medium text-right">إشعارات النظام</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي الإشعارات داخل التطبيق</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <h3 className="font-medium text-right">التنبيهات المتخصصة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="maintenance_reminders" 
                  checked={notificationSettings.maintenance_reminders}
                  onCheckedChange={(checked) => handleSwitchChange('maintenance_reminders', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="maintenance_reminders" className="font-medium text-right">تذكيرات الصيانة</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي إشعارات حول الصيانة المجدولة</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="payment_reminders" 
                  checked={notificationSettings.payment_reminders}
                  onCheckedChange={(checked) => handleSwitchChange('payment_reminders', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="payment_reminders" className="font-medium text-right">تذكيرات الدفع</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي إشعارات حول المدفوعات القادمة والمتأخرة</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="report_notifications" 
                  checked={notificationSettings.report_notifications}
                  onCheckedChange={(checked) => handleSwitchChange('report_notifications', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="report_notifications" className="font-medium text-right">إشعارات التقارير</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي إشعارات عند إنتاج التقارير</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="document_expiration" 
                  checked={notificationSettings.document_expiration}
                  onCheckedChange={(checked) => handleSwitchChange('document_expiration', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="document_expiration" className="font-medium text-right">انتهاء صلاحية الوثائق</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي إشعارات حول الوثائق المنتهية الصلاحية</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="customer_activity" 
                  checked={notificationSettings.customer_activity}
                  onCheckedChange={(checked) => handleSwitchChange('customer_activity', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="customer_activity" className="font-medium text-right">نشاط العملاء</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي إشعارات حول تفاعلات العملاء</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="vehicle_alerts" 
                  checked={notificationSettings.vehicle_alerts}
                  onCheckedChange={(checked) => handleSwitchChange('vehicle_alerts', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="vehicle_alerts" className="font-medium text-right">تنبيهات المركبات</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي إشعارات حول تغييرات حالة المركبات</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="financial_alerts" 
                  checked={notificationSettings.financial_alerts}
                  onCheckedChange={(checked) => handleSwitchChange('financial_alerts', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="financial_alerts" className="font-medium text-right">التنبيهات المالية</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي إشعارات حول الأحداث المالية</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 space-x-reverse">
                <Switch 
                  id="legal_notifications" 
                  checked={notificationSettings.legal_notifications}
                  onCheckedChange={(checked) => handleSwitchChange('legal_notifications', checked)}
                />
                <div className="text-right">
                  <Label htmlFor="legal_notifications" className="font-medium text-right">الإشعارات القانونية</Label>
                  <p className="text-sm text-muted-foreground text-right">تلقي إشعارات حول المسائل القانونية</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="flex items-center gap-2 flex-row-reverse"
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ إعدادات الإشعارات'}
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
