// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Eye, 
  Settings,
  Check,
  X
} from "lucide-react";

export const ThemeTester: React.FC = () => {
  const { theme, setTheme, toggleTheme } = useTheme();

  const themes = [
    { id: 'light', name: 'فاتح', icon: Sun },
    { id: 'dark', name: 'مظلم', icon: Moon },
    { id: 'system', name: 'النظام', icon: Monitor }
  ];

  const testColors = [
    { name: 'Primary', className: 'bg-primary text-primary-foreground' },
    { name: 'Secondary', className: 'bg-secondary text-secondary-foreground' },
    { name: 'Muted', className: 'bg-muted text-muted-foreground' },
    { name: 'Accent', className: 'bg-accent text-accent-foreground' },
    { name: 'Card', className: 'bg-card text-card-foreground border' },
    { name: 'Popover', className: 'bg-popover text-popover-foreground border' }
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            اختبار النظام اللوني
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {themes.map(({ id, name, icon: Icon }) => (
              <Button
                key={id}
                variant={theme === id ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(id as 'light' | 'dark' | 'system')}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">النظام الحالي: {theme}</Badge>
            {toggleTheme && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
              >
                تبديل سريع
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            لوحة الألوان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {testColors.map(({ name, className }) => (
              <div
                key={name}
                className={`p-4 rounded-lg text-center ${className}`}
              >
                <div className="font-medium">{name}</div>
                <div className="text-sm opacity-80">نص تجريبي</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            العناصر التفاعلية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="default">افتراضي</Button>
            <Button variant="secondary">ثانوي</Button>
            <Button variant="outline">مخطط</Button>
            <Button variant="ghost">شفاف</Button>
            <Button variant="link">رابط</Button>
            <Button variant="destructive">تدميري</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>افتراضي</Badge>
            <Badge variant="secondary">ثانوي</Badge>
            <Badge variant="outline">مخطط</Badge>
            <Badge variant="destructive">تدميري</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm">حالة النجاح</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span className="text-sm">حالة الخطأ</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1 text-muted-foreground text-right">
            <div>المتصفح: {navigator.userAgent.split(' ')[0]}</div>
            <div>دعم MatchMedia: {window.matchMedia ? '✅' : '❌'}</div>
            <div>تفضيل النظام: {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'مظلم' : 'فاتح'}</div>
            <div>LocalStorage: {localStorage.getItem('theme') || 'غير محدد'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};