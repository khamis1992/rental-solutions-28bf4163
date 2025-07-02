
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from 'sonner';
import { Calendar, Globe, Settings } from 'lucide-react';

interface HijriDateSettingsProps {
  onSettingsChange?: (settings: HijriDateSettings) => void;
}

export interface HijriDateSettings {
  enableHijriDates: boolean;
  showBothDates: boolean;
  defaultCalendar: 'gregorian' | 'hijri';
  hijriCalendarType: 'tabular' | 'observed';
  dateDisplayFormat: 'arabic' | 'english';
}

export const HijriDateSettings: React.FC<HijriDateSettingsProps> = ({
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<HijriDateSettings>({
    enableHijriDates: true,
    showBothDates: true,
    defaultCalendar: 'gregorian',
    hijriCalendarType: 'tabular',
    dateDisplayFormat: 'arabic'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: keyof HijriDateSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for now (could be extended to save to database)
      localStorage.setItem('hijriDateSettings', JSON.stringify(settings));
      toast.success('تم حفظ إعدادات التقويم الهجري بنجاح');
    } catch (error) {
      console.error('Error saving Hijri date settings:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    const defaultSettings: HijriDateSettings = {
      enableHijriDates: true,
      showBothDates: true,
      defaultCalendar: 'gregorian',
      hijriCalendarType: 'tabular',
      dateDisplayFormat: 'arabic'
    };
    
    setSettings(defaultSettings);
    localStorage.removeItem('hijriDateSettings');
    toast.success('تم إعادة تعيين الإعدادات');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" dir="rtl">
          <Calendar className="h-5 w-5" />
          إعدادات التقويم الهجري
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" dir="rtl">
        {/* Enable Hijri Dates */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">تفعيل التقويم الهجري</Label>
            <p className="text-sm text-muted-foreground">
              عرض التواريخ الهجرية في النظام
            </p>
          </div>
          <Switch
            checked={settings.enableHijriDates}
            onCheckedChange={(value) => handleSettingChange('enableHijriDates', value)}
          />
        </div>

        {settings.enableHijriDates && (
          <>
            {/* Show Both Dates */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">عرض التقويمين معاً</Label>
                <p className="text-sm text-muted-foreground">
                  عرض التاريخ الهجري والميلادي معاً
                </p>
              </div>
              <Switch
                checked={settings.showBothDates}
                onCheckedChange={(value) => handleSettingChange('showBothDates', value)}
              />
            </div>

            {/* Default Calendar */}
            <div className="space-y-2">
              <Label className="text-base font-medium">التقويم الافتراضي</Label>
              <Select
                value={settings.defaultCalendar}
                onValueChange={(value: 'gregorian' | 'hijri') => 
                  handleSettingChange('defaultCalendar', value)
                }
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر التقويم الافتراضي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gregorian" className="text-right">
                    التقويم الميلادي
                  </SelectItem>
                  <SelectItem value="hijri" className="text-right">
                    التقويم الهجري
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                التقويم الذي سيظهر أولاً في منتقي التاريخ
              </p>
            </div>

            {/* Hijri Calendar Type */}
            <div className="space-y-2">
              <Label className="text-base font-medium">نوع التقويم الهجري</Label>
              <Select
                value={settings.hijriCalendarType}
                onValueChange={(value: 'tabular' | 'observed') => 
                  handleSettingChange('hijriCalendarType', value)
                }
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر نوع التقويم الهجري" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tabular" className="text-right">
                    التقويم الحسابي (الجدولي)
                  </SelectItem>
                  <SelectItem value="observed" className="text-right">
                    التقويم المرصود
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                الحسابي أكثر دقة للحسابات، المرصود يعتمد على رؤية الهلال
              </p>
            </div>

            {/* Date Display Format */}
            <div className="space-y-2">
              <Label className="text-base font-medium">تنسيق عرض التاريخ</Label>
              <Select
                value={settings.dateDisplayFormat}
                onValueChange={(value: 'arabic' | 'english') => 
                  handleSettingChange('dateDisplayFormat', value)
                }
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر تنسيق العرض" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arabic" className="text-right">
                    بالعربية (١٤٤٦/٠٣/١٥ هـ)
                  </SelectItem>
                  <SelectItem value="english" className="text-right">
                    بالإنجليزية (1446/03/15 AH)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Settings className="mr-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                حفظ الإعدادات
              </>
            )}
          </Button>
          
          <Button
            onClick={handleResetSettings}
            variant="outline"
            className="flex-1"
          >
            <Globe className="mr-2 h-4 w-4" />
            إعادة تعيين
          </Button>
        </div>

        {/* Preview Section */}
        <div className="bg-muted p-4 rounded-lg">
          <Label className="text-sm font-medium mb-2 block">معاينة التاريخ:</Label>
          <div className="space-y-1 text-sm">
            <div>التاريخ الحالي (ميلادي): {new Date().toLocaleDateString('ar-SA')}</div>
            {settings.enableHijriDates && (
              <div>التاريخ الحالي (هجري): ١٤٤٦/٠٣/١٥ هـ</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Utility function to load settings from localStorage
export const loadHijriDateSettings = (): HijriDateSettings => {
  try {
    const saved = localStorage.getItem('hijriDateSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading Hijri date settings:', error);
  }
  
  // Return default settings
  return {
    enableHijriDates: true,
    showBothDates: true,
    defaultCalendar: 'gregorian',
    hijriCalendarType: 'tabular',
    dateDisplayFormat: 'arabic'
  };
};
