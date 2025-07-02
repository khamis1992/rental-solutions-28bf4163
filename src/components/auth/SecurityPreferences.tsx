import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ShieldCheck, Save } from 'lucide-react';

interface SecurityPreferencesProps {
  initialData?: Record<string, any>;
}

const SecurityPreferences = ({ initialData }: SecurityPreferencesProps) => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    two_factor_auth: initialData?.two_factor_auth ?? false,
    login_alerts: initialData?.login_alerts ?? true,
  });

  const handleSwitchChange = (name: string, checked: boolean) => {
    setPreferences(prev => ({ ...prev, [name]: checked }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const operations = Object.entries(data).map(([key, value]) =>
        supabase
          .from('user_security')
          .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' })
      );
      await Promise.all(operations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-security'] });
      toast.success('تم حفظ تفضيلات الأمان');
    },
    onError: (error) => {
      toast.error('فشل في حفظ تفضيلات الأمان');
      console.error('خطأ في حفظ تفضيلات الأمان:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(preferences);
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="text-right">
            <CardTitle className="text-right">تفضيلات الأمان</CardTitle>
            <CardDescription className="text-right">إدارة خيارات المصادقة والأمان</CardDescription>
          </div>
          <ShieldCheck className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between flex-row-reverse">
            <Switch
              id="two_factor_auth"
              checked={preferences.two_factor_auth}
              onCheckedChange={(checked) => handleSwitchChange('two_factor_auth', checked)}
            />
            <div className="text-right">
              <Label htmlFor="two_factor_auth" className="font-medium">المصادقة الثنائية</Label>
              <p className="text-sm text-muted-foreground">تتطلب خطوة تحقق إضافية عند تسجيل الدخول</p>
            </div>
          </div>

          <div className="flex items-center justify-between flex-row-reverse">
            <Switch
              id="login_alerts"
              checked={preferences.login_alerts}
              onCheckedChange={(checked) => handleSwitchChange('login_alerts', checked)}
            />
            <div className="text-right">
              <Label htmlFor="login_alerts" className="font-medium">تنبيهات تسجيل الدخول</Label>
              <p className="text-sm text-muted-foreground">إرسال تنبيه عند دخول جهاز جديد</p>
            </div>
          </div>

          <div className="flex justify-end flex-row-reverse">
            <Button type="submit" disabled={saveMutation.isPending} className="flex items-center gap-2 space-x-reverse space-x-2">
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التفضيلات'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SecurityPreferences;
