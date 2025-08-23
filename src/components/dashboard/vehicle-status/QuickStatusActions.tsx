// @ts-nocheck
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  AlertTriangle, 
  Wrench, 
  CheckCircle, 
  Eye,
  Bell,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface QuickStatusActionsProps {
  criticalCount: number;
  availableCount: number;
  maintenanceCount: number;
  onNavigate: (path: string) => void;
}

export const QuickStatusActions: React.FC<QuickStatusActionsProps> = ({
  criticalCount,
  availableCount,
  maintenanceCount,
  onNavigate
}) => {
  const { language } = useLanguage();

  const quickActions = [
    {
      id: 'add-vehicle',
      label: 'إضافة مركبة جديدة',
      description: 'إضافة مركبة جديدة للأسطول',
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      onClick: () => onNavigate('/vehicles/add'),
      showAlways: true
    },
    {
      id: 'view-critical',
      label: 'المركبات الحرجة',
      description: `${criticalCount} مركبة تحتاج انتباه فوري`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      onClick: () => onNavigate('/vehicles?status=accident,stolen,police_station'),
      showWhen: criticalCount > 0,
      badge: criticalCount,
      pulse: true
    },
    {
      id: 'schedule-maintenance',
      label: 'جدولة الصيانة',
      description: `${maintenanceCount} مركبة تحت الصيانة`,
      icon: Wrench,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      onClick: () => onNavigate('/maintenance/schedule'),
      showWhen: maintenanceCount > 0,
      badge: maintenanceCount
    },
    {
      id: 'available-vehicles',
      label: 'المركبات المتاحة',
      description: `${availableCount} مركبة جاهزة للتأجير`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      onClick: () => onNavigate('/vehicles?status=available'),
      showWhen: availableCount > 0,
      badge: availableCount
    }
  ];

  const visibleActions = quickActions.filter(action => 
    action.showAlways || action.showWhen
  );

  if (visibleActions.length === 0) return null;

  return (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={cn(
        "flex items-center justify-between",
        language === 'ar' && 'flex-row-reverse'
      )}>
        <div className={cn(
          "flex items-center gap-2",
          language === 'ar' && 'flex-row-reverse'
        )}>
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            إجراءات سريعة
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/vehicles')}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          عرض جميع المركبات
          <ArrowRight className={cn(
            "h-3 w-3",
            language === 'ar' ? 'mr-1 rotate-180' : 'ml-1'
          )} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Button
              key={action.id}
              variant="outline"
              onClick={action.onClick}
              className={cn(
                "relative h-auto p-4 flex flex-col items-center text-center gap-3 transition-all duration-200",
                "hover:shadow-md hover:scale-[1.02] border-2",
                action.bgColor,
                action.borderColor,
                action.pulse && "animate-pulse"
              )}
            >
              {action.badge && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {action.badge}
                </Badge>
              )}
              
              <div className={cn(
                "p-3 rounded-full transition-colors",
                action.bgColor
              )}>
                <Icon className={cn("h-5 w-5", action.color)} />
              </div>
              
              <div>
                <div className={cn(
                  "font-semibold text-sm text-foreground",
                  language === 'ar' ? 'text-right' : 'text-left'
                )}>
                  {action.label}
                </div>
                <div className={cn(
                  "text-xs text-muted-foreground mt-1",
                  language === 'ar' ? 'text-right' : 'text-left'
                )}>
                  {action.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};