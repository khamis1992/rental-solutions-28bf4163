import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'switch' | 'select' | 'button';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'select', 
  showLabel = true, 
  className = '' 
}) => {
  const { theme, setTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Switch variant - for simple dark/light toggle
  if (variant === 'switch') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        {showLabel && (
          <div>
            <Label htmlFor="dark_mode" className="font-medium">الوضع المظلم</Label>
            <p className="text-sm text-muted-foreground">تفعيل الوضع المظلم للنظام</p>
          </div>
        )}
        <Switch 
          id="dark_mode" 
          checked={theme === 'dark'}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        />
      </div>
    );
  }

  // Button variant - icons only
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          if (theme === 'light') setTheme('dark');
          else if (theme === 'dark') setTheme('system');
          else setTheme('light');
        }}
        className={className}
      >
        {theme === 'light' && <Sun className="h-4 w-4" />}
        {theme === 'dark' && <Moon className="h-4 w-4" />}
        {theme === 'system' && <Monitor className="h-4 w-4" />}
        <span className="sr-only">تبديل الثيم</span>
      </Button>
    );
  }

  // Select variant - full control (default)
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div>
          <Label htmlFor="theme-select" className="font-medium">المظهر</Label>
          <p className="text-sm text-muted-foreground">اختر مظهر النظام المفضل لديك</p>
        </div>
      )}
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger id="theme-select">
          <SelectValue placeholder="اختر المظهر" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>فاتح</span>
            </div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>مظلم</span>
            </div>
          </SelectItem>
          <SelectItem value="system">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>تلقائي (حسب النظام)</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeToggle; 