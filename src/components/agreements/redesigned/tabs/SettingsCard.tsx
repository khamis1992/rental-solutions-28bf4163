
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 flex-row-reverse">
              <Settings className="h-5 w-5" />
              إعدادات العقد
            </CardTitle>
            <CardDescription className="text-right mt-1">
              إدارة إعدادات العقد والتفضيلات
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
            <Bell className="h-5 w-5" />
            إعدادات التنبيهات
          </CardTitle>
          <CardDescription className="text-right">
            إدارة التنبيهات والإشعارات الخاصة بهذا العقد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="text-right">
              <Label htmlFor="notifications" className="text-base font-medium">
                تفعيل التنبيهات
              </Label>
              <p className="text-sm text-muted-foreground">
                استقبال تنبيهات حول المدفوعات والمواعيد المهمة
              </p>
            </div>
            <Switch 
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <div className="flex items-center justify-between flex-row-reverse">
            <div className="text-right">
              <Label htmlFor="email-reminders" className="text-base font-medium">
                تذكير بالبريد الإلكتروني
              </Label>
              <p className="text-sm text-muted-foreground">
                إرسال تذكيرات بالبريد الإلكتروني للمدفوعات المستحقة
              </p>
            </div>
            <Switch 
              id="email-reminders"
              checked={emailReminders}
              onCheckedChange={setEmailReminders}
            />
          </div>

          <div className="flex items-center justify-between flex-row-reverse">
            <div className="text-right">
              <Label htmlFor="auto-renewal" className="text-base font-medium">
                التجديد التلقائي
              </Label>
              <p className="text-sm text-muted-foreground">
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
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
            <Shield className="h-5 w-5" />
            إعدادات الأمان
          </CardTitle>
          <CardDescription className="text-right">
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
          <CardTitle className="text-right">إجراءات العقد</CardTitle>
          <CardDescription className="text-right">
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

      {/* Agreement Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">معلومات النظام</CardTitle>
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
