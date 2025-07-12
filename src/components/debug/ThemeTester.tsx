import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, Palette, CheckCircle, AlertTriangle } from 'lucide-react';

export const ThemeTester: React.FC = () => {
  const { theme, setTheme, resolvedTheme, isLoading } = useTheme();

  const testColors = [
    { name: 'Background', class: 'bg-background', text: 'bg-background' },
    { name: 'Primary', class: 'bg-primary text-primary-foreground', text: 'bg-primary' },
    { name: 'Secondary', class: 'bg-secondary text-secondary-foreground', text: 'bg-secondary' },
    { name: 'Muted', class: 'bg-muted text-muted-foreground', text: 'bg-muted' },
    { name: 'Card', class: 'bg-card text-card-foreground border', text: 'bg-card' },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Palette className="h-5 w-5" />
          فاحص الثيم - Theme Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* حالة الثيم الحالية */}
        <div className="space-y-2">
          <h3 className="font-medium text-right">الحالة الحالية:</h3>
          <div className="flex items-center gap-2 justify-end">
            <Badge variant={isLoading ? 'secondary' : 'default'}>
              {isLoading ? 'جاري التحميل...' : 'محمل'}
            </Badge>
            <Badge variant="outline" className="gap-1">
              {resolvedTheme === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
              {resolvedTheme === 'dark' ? 'مظلم' : 'فاتح'}
            </Badge>
            <Badge variant="outline">
              الثيم: {theme === 'system' ? 'تلقائي' : theme === 'dark' ? 'مظلم' : 'فاتح'}
            </Badge>
          </div>
        </div>

        {/* أزرار التبديل السريع */}
        <div className="space-y-2">
          <h3 className="font-medium text-right">اختبار التبديل:</h3>
          <div className="flex gap-2 justify-end">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              className="gap-1"
            >
              <Sun className="h-4 w-4" />
              فاتح
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="gap-1"
            >
              <Moon className="h-4 w-4" />
              مظلم
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
              className="gap-1"
            >
              <Monitor className="h-4 w-4" />
              تلقائي
            </Button>
          </div>
        </div>

        {/* اختبار الألوان */}
        <div className="space-y-2">
          <h3 className="font-medium text-right">اختبار الألوان:</h3>
          <div className="grid grid-cols-1 gap-2">
            {testColors.map((color) => (
              <div
                key={color.name}
                className={`p-3 rounded-md ${color.class} transition-colors duration-200`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono">{color.text}</span>
                  <span className="font-medium">{color.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* فحص الصحة */}
        <div className="space-y-2">
          <h3 className="font-medium text-right">فحص الصحة:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 justify-end">
              <span>LocalStorage</span>
              {localStorage.getItem('theme') ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span>CSS Classes</span>
              {document.documentElement.classList.contains('dark') || 
               document.documentElement.classList.contains('light') ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span>Theme Context</span>
              {theme ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span>CSS Variables</span>
              {getComputedStyle(document.documentElement).getPropertyValue('--background') ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* معلومات النظام */}
        <div className="space-y-2">
          <h3 className="font-medium text-right">معلومات النظام:</h3>
          <div className="text-xs space-y-1 text-muted-foreground text-right">
            <div>المتصفح: {navigator.userAgent.split(' ')[0]}</div>
            <div>دعم MatchMedia: {window.matchMedia ? '✅' : '❌'}</div>
            <div>تفضيل النظام: {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'مظلم' : 'فاتح'}</div>
            <div>LocalStorage: {localStorage.getItem('theme') || 'غير محدد'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeTester; 