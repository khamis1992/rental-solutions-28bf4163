
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bell, 
  Clock, 
  Filter,
  Palette,
  Volume2,
  Mail,
  MessageSquare,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AlertPreferences {
  notifications: {
    enabled: boolean;
    sound: boolean;
    email: boolean;
    sms: boolean;
    desktop: boolean;
  };
  priorities: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  categories: {
    financial: boolean;
    operational: boolean;
    compliance: boolean;
    customer: boolean;
  };
  thresholds: {
    overduePayments: number;
    maintenanceBacklog: number;
    contractExpiration: number;
    utilizationRate: number;
  };
  display: {
    autoRefresh: boolean;
    refreshInterval: number;
    showDetails: boolean;
    maxAlertsDisplay: number;
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
  };
  schedule: {
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    weekends: boolean;
    holidays: boolean;
  };
}

const defaultPreferences: AlertPreferences = {
  notifications: {
    enabled: true,
    sound: true,
    email: false,
    sms: false,
    desktop: true,
  },
  priorities: {
    critical: true,
    high: true,
    medium: true,
    low: false,
  },
  categories: {
    financial: true,
    operational: true,
    compliance: true,
    customer: true,
  },
  thresholds: {
    overduePayments: 5,
    maintenanceBacklog: 5,
    contractExpiration: 30,
    utilizationRate: 60,
  },
  display: {
    autoRefresh: true,
    refreshInterval: 60,
    showDetails: true,
    maxAlertsDisplay: 10,
    theme: 'auto',
    compactMode: false,
  },
  schedule: {
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    weekends: true,
    holidays: true,
  },
};

export const SmartAlertsSettings: React.FC<{ 
  onClose: () => void;
  className?: string;
}> = ({ onClose, className }) => {
  const [preferences, setPreferences] = useState<AlertPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePreference = (path: string, value: any) => {
    setPreferences(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current = updated as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  const savePreferences = () => {
    // Here you would typically save to localStorage or backend
    localStorage.setItem('smartAlertsPreferences', JSON.stringify(preferences));
    setHasChanges(false);
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم حفظ تفضيلات التنبيهات الذكية بنجاح"
    });
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
    toast({
      title: "تم إعادة تعيين الإعدادات",
      description: "تم استعادة الإعدادات الافتراضية"
    });
  };

  return (
    <Card className={className} dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <div className="text-right">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <span>إعدادات التنبيهات الذكية</span>
              <Settings className="h-5 w-5" />
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
            <TabsTrigger value="filters">المرشحات</TabsTrigger>
            <TabsTrigger value="thresholds">العتبات</TabsTrigger>
            <TabsTrigger value="display">العرض</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Switch
                  checked={preferences.notifications.enabled}
                  onCheckedChange={(value) => updatePreference('notifications.enabled', value)}
                />
                <Label className="text-right">تفعيل الإشعارات</Label>
              </div>

              {preferences.notifications.enabled && (
                <div className="space-y-3 pr-6 border-r-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={preferences.notifications.sound}
                        onCheckedChange={(value) => updatePreference('notifications.sound', value)}
                      />
                      <Volume2 className="h-4 w-4" />
                    </div>
                    <Label className="text-right">الصوت</Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={preferences.notifications.email}
                        onCheckedChange={(value) => updatePreference('notifications.email', value)}
                      />
                      <Mail className="h-4 w-4" />
                    </div>
                    <Label className="text-right">البريد الإلكتروني</Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={preferences.notifications.sms}
                        onCheckedChange={(value) => updatePreference('notifications.sms', value)}
                      />
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <Label className="text-right">الرسائل النصية</Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={preferences.notifications.desktop}
                        onCheckedChange={(value) => updatePreference('notifications.desktop', value)}
                      />
                      <Bell className="h-4 w-4" />
                    </div>
                    <Label className="text-right">إشعارات سطح المكتب</Label>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Label className="text-right block mb-3">ساعات الهدوء</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Switch
                      checked={preferences.schedule.quietHours.enabled}
                      onCheckedChange={(value) => updatePreference('schedule.quietHours.enabled', value)}
                    />
                    <Label className="text-right">تفعيل ساعات الهدوء</Label>
                  </div>

                  {preferences.schedule.quietHours.enabled && (
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <input
                        type="time"
                        value={preferences.schedule.quietHours.end}
                        onChange={(e) => updatePreference('schedule.quietHours.end', e.target.value)}
                        className="px-3 py-2 border rounded"
                      />
                      <span>إلى</span>
                      <input
                        type="time"
                        value={preferences.schedule.quietHours.start}
                        onChange={(e) => updatePreference('schedule.quietHours.start', e.target.value)}
                        className="px-3 py-2 border rounded"
                      />
                      <Label className="text-right">من</Label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="space-y-6">
              <div>
                <Label className="text-right block mb-3">مستويات الأولوية</Label>
                <div className="space-y-2">
                  {Object.entries(preferences.priorities).map(([priority, enabled]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <Switch
                        checked={enabled}
                        onCheckedChange={(value) => updatePreference(`priorities.${priority}`, value)}
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Badge className={
                          priority === 'critical' ? 'bg-red-100 text-red-800' :
                          priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {priority === 'critical' ? 'حرج' :
                           priority === 'high' ? 'عالي' :
                           priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        <Label className="text-right">{priority === 'critical' ? 'التنبيهات الحرجة' : priority === 'high' ? 'التنبيهات العالية' : priority === 'medium' ? 'التنبيهات المتوسطة' : 'التنبيهات المنخفضة'}</Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-right block mb-3">الفئات</Label>
                <div className="space-y-2">
                  {Object.entries(preferences.categories).map(([category, enabled]) => (
                    <div key={category} className="flex items-center justify-between">
                      <Switch
                        checked={enabled}
                        onCheckedChange={(value) => updatePreference(`categories.${category}`, value)}
                      />
                      <Label className="text-right">
                        {category === 'financial' ? 'المالية' :
                         category === 'operational' ? 'التشغيلية' :
                         category === 'compliance' ? 'الامتثال' : 'العملاء'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="thresholds" className="space-y-4">
            <div className="space-y-6">
              <div>
                <Label className="text-right block mb-3">الدفعات المتأخرة (عدد الدفعات)</Label>
                <Slider
                  value={[preferences.thresholds.overduePayments]}
                  onValueChange={([value]) => updatePreference('thresholds.overduePayments', value)}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground mt-1">
                  {preferences.thresholds.overduePayments} دفعات
                </div>
              </div>

              <div>
                <Label className="text-right block mb-3">تراكم الصيانة (عدد المركبات)</Label>
                <Slider
                  value={[preferences.thresholds.maintenanceBacklog]}
                  onValueChange={([value]) => updatePreference('thresholds.maintenanceBacklog', value)}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground mt-1">
                  {preferences.thresholds.maintenanceBacklog} مركبات
                </div>
              </div>

              <div>
                <Label className="text-right block mb-3">انتهاء العقود (الأيام المتبقية)</Label>
                <Slider
                  value={[preferences.thresholds.contractExpiration]}
                  onValueChange={([value]) => updatePreference('thresholds.contractExpiration', value)}
                  max={90}
                  min={7}
                  step={7}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground mt-1">
                  {preferences.thresholds.contractExpiration} يوم
                </div>
              </div>

              <div>
                <Label className="text-right block mb-3">معدل الاستخدام المنخفض (%)</Label>
                <Slider
                  value={[preferences.thresholds.utilizationRate]}
                  onValueChange={([value]) => updatePreference('thresholds.utilizationRate', value)}
                  max={90}
                  min={30}
                  step={5}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground mt-1">
                  أقل من {preferences.thresholds.utilizationRate}%
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Switch
                  checked={preferences.display.autoRefresh}
                  onCheckedChange={(value) => updatePreference('display.autoRefresh', value)}
                />
                <Label className="text-right">التحديث التلقائي</Label>
              </div>

              {preferences.display.autoRefresh && (
                <div>
                  <Label className="text-right block mb-3">فترة التحديث (ثوانٍ)</Label>
                  <Select
                    value={preferences.display.refreshInterval.toString()}
                    onValueChange={(value) => updatePreference('display.refreshInterval', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 ثانية</SelectItem>
                      <SelectItem value="60">دقيقة واحدة</SelectItem>
                      <SelectItem value="120">دقيقتان</SelectItem>
                      <SelectItem value="300">5 دقائق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Switch
                  checked={preferences.display.showDetails}
                  onCheckedChange={(value) => updatePreference('display.showDetails', value)}
                />
                <Label className="text-right">إظهار التفاصيل</Label>
              </div>

              <div className="flex items-center justify-between">
                <Switch
                  checked={preferences.display.compactMode}
                  onCheckedChange={(value) => updatePreference('display.compactMode', value)}
                />
                <Label className="text-right">الوضع المدمج</Label>
              </div>

              <div>
                <Label className="text-right block mb-3">عدد التنبيهات المعروضة</Label>
                <Slider
                  value={[preferences.display.maxAlertsDisplay]}
                  onValueChange={([value]) => updatePreference('display.maxAlertsDisplay', value)}
                  max={20}
                  min={5}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground mt-1">
                  {preferences.display.maxAlertsDisplay} تنبيهات
                </div>
              </div>

              <div>
                <Label className="text-right block mb-3">المظهر</Label>
                <Select
                  value={preferences.display.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') => updatePreference('display.theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">داكن</SelectItem>
                    <SelectItem value="auto">تلقائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 mt-6 border-t">
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <span>إعادة تعيين</span>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={savePreferences}
            disabled={!hasChanges}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <span>حفظ الإعدادات</span>
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
