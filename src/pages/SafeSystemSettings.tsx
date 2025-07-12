import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";
import { useSafeSettings } from "@/contexts/SafeSettingsContext";
import { EmergencyReset } from "@/utils/emergency-reset";

interface SettingChangeEvent {
  key: string;
  value: any;
  timestamp: number;
}

const SafeSystemSettings = () => {
  const { settings, loading, updateSetting, getSetting } = useSafeSettings();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const changeHistory = useRef<SettingChangeEvent[]>([]);
  const lastChangeTime = useRef<number>(0);

  // Safe setting update with debouncing and loop prevention
  const handleSettingChange = useCallback(async (key: string, value: any) => {
    const now = Date.now();
    
    // Prevent rapid changes
    if (now - lastChangeTime.current < 1000) {
      console.warn('⚠️ Setting change too rapid, ignoring');
      return;
    }
    
    // Check for repeated changes (potential loop)
    const recentChanges = changeHistory.current.filter(
      change => now - change.timestamp < 5000 && change.key === key
    );
    
    if (recentChanges.length > 3) {
      console.error('🚨 Too many rapid setting changes detected, blocking');
      toast.error('تم منع التغيير المتكرر للحماية من التجمد');
      return;
    }

    lastChangeTime.current = now;
    changeHistory.current.push({ key, value, timestamp: now });

    // Keep only recent history
    changeHistory.current = changeHistory.current.filter(
      change => now - change.timestamp < 30000
    );

    try {
      setIsUpdating(key);
      
      // Special handling for theme changes
      if (key === 'theme') {
        console.log(`🎨 Theme change requested: ${value}`);
        
        // Apply theme with timeout protection
        const applyTheme = () => {
          try {
            document.documentElement.classList.remove('light', 'dark');
            if (value !== 'system') {
              document.documentElement.classList.add(value);
            }
          } catch (error) {
            console.error('❌ Theme application failed:', error);
          }
        };
        
        // Apply immediately for visual feedback
        applyTheme();
        
        // Save to database with timeout
        await Promise.race([
          updateSetting(key, value),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Setting update timeout')), 5000)
          )
        ]);
      } else {
        await updateSetting(key, value);
      }
      
      console.log(`✅ Setting ${key} updated successfully`);
    } catch (error: any) {
      console.error(`❌ Failed to update ${key}:`, error);
      toast.error(`فشل في تحديث الإعداد: ${error.message}`);
      
      // Revert theme if it was a theme change
      if (key === 'theme') {
        const currentTheme = getSetting('theme', 'light');
        document.documentElement.classList.remove('light', 'dark');
        if (currentTheme !== 'system') {
          document.documentElement.classList.add(currentTheme);
        }
      }
    } finally {
      setIsUpdating(null);
    }
  }, [updateSetting, getSetting]);

  const handleEmergencyReset = useCallback(() => {
    if (confirm('هل أنت متأكد من إعادة تعيين النظام؟ سيتم مسح جميع البيانات المحلية.')) {
      EmergencyReset.performEmergencyReset();
    }
  }, []);

  const currentTheme = getSetting('theme', 'light');
  const currentLanguage = getSetting('language', 'ar');
  const currentRtl = getSetting('rtl', true);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">إعدادات النظام</h1>
        <Button 
          onClick={handleEmergencyReset}
          variant="destructive"
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          إعادة تعيين طارئة
        </Button>
      </div>

      {/* Emergency Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            تحذير أمان
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700">
          <p>إذا واجهت تجمد في النظام بعد تغيير الإعدادات، يمكنك:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>استخدم زر "إعادة تعيين طارئة" أعلاه</li>
            <li>أو اكتب في console: <code>emergencyReset()</code></li>
            <li>أو استخدم الزر الأحمر في أعلى الصفحة</li>
          </ul>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات المظهر</CardTitle>
          <CardDescription>تخصيص مظهر النظام</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">المظهر</Label>
            <Select
              value={currentTheme}
              onValueChange={(value) => handleSettingChange('theme', value)}
              disabled={isUpdating === 'theme' || loading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
                {isUpdating === 'theme' && (
                  <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">فاتح</SelectItem>
                <SelectItem value="dark">داكن</SelectItem>
                <SelectItem value="system">تلقائي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="language">اللغة</Label>
            <Select
              value={currentLanguage}
              onValueChange={(value) => handleSettingChange('language', value)}
              disabled={isUpdating === 'language' || loading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
                {isUpdating === 'language' && (
                  <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rtl">اتجاه النص (RTL)</Label>
            <Switch
              id="rtl"
              checked={currentRtl}
              onCheckedChange={(checked) => handleSettingChange('rtl', checked)}
              disabled={isUpdating === 'rtl' || loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Change History (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>سجل التغييرات (للمطورين)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {changeHistory.current.slice(-5).map((change, index) => (
                <div key={index} className="font-mono text-xs">
                  {new Date(change.timestamp).toLocaleTimeString()}: {change.key} = {JSON.stringify(change.value)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SafeSystemSettings; 