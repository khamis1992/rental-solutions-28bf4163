import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  Zap, 
  UserPlus, 
  Calendar, 
  Wrench, 
  Clock, 
  Package, 
  AlertTriangle,
  FileText,
  Users
} from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  badge?: string | number;
  urgent?: boolean;
}

interface QuickActionsPanelProps {
  onEmergencyMaintenance: () => void;
  onAssignTechnician: () => void;
  onPostponeMaintenance: () => void;
  onRequestParts: () => void;
  onViewReports: () => void;
  onManageTeam: () => void;
  urgentCount?: number;
  pendingAssignments?: number;
  className?: string;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onEmergencyMaintenance,
  onAssignTechnician,
  onPostponeMaintenance,
  onRequestParts,
  onViewReports,
  onManageTeam,
  urgentCount = 0,
  pendingAssignments = 0,
  className
}) => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'emergency',
      title: language === 'ar' ? 'صيانة طارئة' : 'Emergency Maintenance',
      description: language === 'ar' ? 'إضافة صيانة عاجلة' : 'Add urgent maintenance',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'bg-red-500 hover:bg-red-600',
      action: onEmergencyMaintenance,
      badge: urgentCount > 0 ? urgentCount : undefined,
      urgent: true
    },
    {
      id: 'assign',
      title: language === 'ar' ? 'تعيين فني' : 'Assign Technician',
      description: language === 'ar' ? 'تعيين فني للصيانة' : 'Assign technician to maintenance',
      icon: <UserPlus className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: onAssignTechnician,
      badge: pendingAssignments > 0 ? pendingAssignments : undefined
    },
    {
      id: 'postpone',
      title: language === 'ar' ? 'تأجيل صيانة' : 'Postpone Maintenance',
      description: language === 'ar' ? 'تأجيل صيانة مجدولة' : 'Postpone scheduled maintenance',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: onPostponeMaintenance
    },
    {
      id: 'parts',
      title: language === 'ar' ? 'طلب قطع غيار' : 'Request Parts',
      description: language === 'ar' ? 'طلب قطع غيار جديدة' : 'Request new spare parts',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: onRequestParts
    },
    {
      id: 'reports',
      title: language === 'ar' ? 'تقارير الصيانة' : 'Maintenance Reports',
      description: language === 'ar' ? 'عرض تقارير الأداء' : 'View performance reports',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: onViewReports
    },
    {
      id: 'team',
      title: language === 'ar' ? 'إدارة الفريق' : 'Manage Team',
      description: language === 'ar' ? 'إدارة فريق الصيانة' : 'Manage maintenance team',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: onManageTeam
    }
  ];

  const primaryActions = quickActions.slice(0, 3);
  const secondaryActions = quickActions.slice(3);

  const ActionButton: React.FC<{ action: QuickAction; size?: 'sm' | 'lg' }> = ({ 
    action, 
    size = 'lg' 
  }) => (
    <Button
      onClick={action.action}
      className={cn(
        "text-white border-0 transition-all duration-200 transform hover:scale-105 relative",
        action.color,
        size === 'lg' 
          ? "h-20 p-4" 
          : "h-12 p-2",
        language === 'ar' ? 'flex-row-reverse' : ''
      )}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className={cn(
        "flex items-center gap-3",
        language === 'ar' ? 'flex-row-reverse' : '',
        size === 'lg' ? 'flex-col gap-2' : ''
      )}>
        <div className="relative">
          {action.icon}
          {action.badge && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {action.badge}
            </Badge>
          )}
        </div>
        <div className={cn(
          "flex flex-col",
          language === 'ar' ? 'text-right' : 'text-left',
          size === 'lg' ? 'items-center text-center' : ''
        )}>
          <span className={cn(
            "font-medium",
            size === 'lg' ? 'text-sm' : 'text-xs'
          )}>
            {action.title}
          </span>
          {size === 'lg' && (
            <span className="text-xs opacity-90 mt-1">
              {action.description}
            </span>
          )}
        </div>
      </div>
      {action.urgent && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
      )}
    </Button>
  );

  return (
    <Card className={cn("w-full", className)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className={cn(
          "flex items-center justify-between",
          language === 'ar' ? 'flex-row-reverse text-right' : ''
        )}>
          <div className={cn(
            "flex items-center gap-2",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>{language === 'ar' ? 'الإجراءات السريعة' : 'Quick Actions'}</span>
          </div>
          
          {secondaryActions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "text-xs",
                language === 'ar' ? 'flex-row-reverse' : ''
              )}
            >
              {isExpanded 
                ? (language === 'ar' ? 'أقل' : 'Less')
                : (language === 'ar' ? 'المزيد' : 'More')
              }
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {primaryActions.map((action) => (
            <ActionButton key={action.id} action={action} size="lg" />
          ))}
        </div>

        {/* Secondary Actions (Expandable) */}
        {isExpanded && secondaryActions.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {secondaryActions.map((action) => (
                <ActionButton key={action.id} action={action} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className={cn(
          "flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm",
          language === 'ar' ? 'flex-row-reverse text-right' : ''
        )}>
          <div className={cn(
            "flex items-center gap-4",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            {urgentCount > 0 && (
              <div className={cn(
                "flex items-center gap-1",
                language === 'ar' ? 'flex-row-reverse' : ''
              )}>
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">
                  {urgentCount} {language === 'ar' ? 'عاجل' : 'urgent'}
                </span>
              </div>
            )}
            
            {pendingAssignments > 0 && (
              <div className={cn(
                "flex items-center gap-1",
                language === 'ar' ? 'flex-row-reverse' : ''
              )}>
                <UserPlus className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600 font-medium">
                  {pendingAssignments} {language === 'ar' ? 'في الانتظار' : 'pending'}
                </span>
              </div>
            )}
            
            {urgentCount === 0 && pendingAssignments === 0 && (
              <span className="text-green-600 font-medium">
                {language === 'ar' ? '✓ جميع المهام مُدارة' : '✓ All tasks managed'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 