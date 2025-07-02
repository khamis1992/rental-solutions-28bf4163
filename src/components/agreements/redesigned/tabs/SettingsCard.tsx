
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { Switch } from '@/components/ui/switch';

import { Settings, Edit, Trash2, Bell, Shield } from 'lucide-react';
import { useState } from 'react';

interface SettingsCardProps {
  agreement: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function SettingsCard({
  agreement,
  onEdit,
  onDelete
}: SettingsCardProps) {
  const [notifications, setNotifications] = useState(true);
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [emailReminders, setEmailReminders] = useState(true);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <CardTitle className="flex items-center justify-between text-left">
                <span className="text-left">إعدادات العقد</span>
                <Settings className="h-5 w-5" />
              </CardTitle>
              <CardDescription className="text-left mt-1">
                إدارة إعدادات العقد والتفضيلات
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-left">
            <span className="text-left">إعدادات التنبيهات</span>
            <Bell className="h-5 w-5" />
          </CardTitle>
          <CardDescription className="text-left">
            إدارة التنبيهات والإشعارات الخاصة بهذا العقد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <Label htmlFor="notifications" className="text-base font-medium text-left">
                تفعيل التنبيهات
              </Label>
              <p className="text-sm text-muted-foreground text-left">
                استقبال تنبيهات حول المدفوعات والمواعيد المهمة
              </p>
            </div>
            <Switch 
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-left">
              <Label htmlFor="email-reminders" className="text-base font-medium text-left">
                تذكير بالبريد الإلكتروني
              </Label>
              <p className="text-sm text-muted-foreground text-left">
                إرسال تذكيرات بالبريد الإلكتروني للمدفوعات المستحقة
              </p>
            </div>
            <Switch 
              id="email-reminders"
              checked={emailReminders}
              onCheckedChange={setEmailReminders}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-left">
              <Label htmlFor="auto-renewal" className="text-base font-medium text-left">
                التجديد التلقائي
              </Label>
              <p className="text-sm text-muted-foreground text-left">
                تجديد العقد تلقائياً عند انتهاء المدة
              </p>
            </div>
            <Switch 
              id="auto-renewal"
              checked={autoRenewal}
              onCheckedChange={setAutoRenewal}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-left">
            <span className="text-left">إعدادات الأمان</span>
            <Shield className="h-5 w-5" />
          </CardTitle>
          <CardDescription className="text-left">
            إعدادات الأمان والخصوصية للعقد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-right">
              <h4 className="font-medium text-blue-900">حماية البيانات</h4>
              <p className="text-sm text-blue-700 mt-1">
                جميع البيانات محمية ومشفرة وفقاً لأعلى معايير الأمان
              </p>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-right">
              <h4 className="font-medium text-green-900">النسخ الاحتياطي</h4>
              <p className="text-sm text-green-700 mt-1">
                يتم إنشاء نسخ احتياطية من بيانات العقد تلقائياً كل 24 ساعة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">إجراءات العقد</CardTitle>
          <CardDescription className="text-left">
            الإجراءات المتاحة لإدارة هذا العقد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={onEdit}
            className="w-full flex items-center gap-2 flex-row-reverse"
            variant="outline"
          >
            <Edit className="h-4 w-4" />
            تعديل معلومات العقد
          </Button>
          
          <Button 
            onClick={onDelete}
            variant="destructive"
            className="w-full flex items-center gap-2 flex-row-reverse"
          >
            <Trash2 className="h-4 w-4" />
            حذف العقد نهائياً
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">معلومات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">معرف العقد</p>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                {agreement.id}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">إصدار النظام</p>
              <p className="font-medium">2.1.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
