import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, XCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimelineStage {
  name: string;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
  date?: string;
  description?: string;
  assignedTo?: string;
  cost?: number;
}

interface MaintenanceTimelineProps {
  stages: TimelineStage[];
  vehicleInfo?: {
    make: string;
    model: string;
    licensePlate: string;
  };
  maintenanceType?: string;
  className?: string;
}

export const MaintenanceTimeline: React.FC<MaintenanceTimelineProps> = ({
  stages,
  vehicleInfo,
  maintenanceType,
  className
}) => {
  const { language } = useLanguage();

  const getStageIcon = (status: TimelineStage['status']) => {
    const iconClasses = "h-5 w-5";
    
    switch (status) {
      case 'completed':
        return <CheckCircle className={cn(iconClasses, "text-green-500")} />;
      case 'current':
        return <Clock className={cn(iconClasses, "text-blue-500 animate-pulse")} />;
      case 'pending':
        return <AlertTriangle className={cn(iconClasses, "text-gray-400")} />;
      case 'cancelled':
        return <XCircle className={cn(iconClasses, "text-red-500")} />;
      default:
        return <Clock className={cn(iconClasses, "text-gray-400")} />;
    }
  };

  const getStageColor = (status: TimelineStage['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'current':
        return 'border-blue-500 bg-blue-50';
      case 'pending':
        return 'border-gray-300 bg-gray-50';
      case 'cancelled':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusBadge = (status: TimelineStage['status']) => {
    const badges = {
      completed: { label: language === 'ar' ? 'مكتملة' : 'Completed', variant: 'default' as const },
      current: { label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', variant: 'default' as const },
      pending: { label: language === 'ar' ? 'في الانتظار' : 'Pending', variant: 'secondary' as const },
      cancelled: { label: language === 'ar' ? 'ملغاة' : 'Cancelled', variant: 'destructive' as const }
    };

    const badgeInfo = badges[status];
    return (
      <Badge variant={badgeInfo.variant} className="text-xs">
        {badgeInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return language === 'ar' 
      ? `${amount.toFixed(2)} ر.ق`
      : `QAR ${amount.toFixed(2)}`;
  };

  return (
    <Card className={cn("w-full", className)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-3", language === 'ar' ? 'flex-row-reverse text-right' : '')}>
          <Calendar className="h-5 w-5 text-blue-500" />
          <div className={language === 'ar' ? 'text-right' : ''}>
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'مراحل الصيانة' : 'Maintenance Timeline'}
            </h3>
            {vehicleInfo && (
              <p className="text-sm text-muted-foreground">
                {`${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.licensePlate})`}
              </p>
            )}
            {maintenanceType && (
              <p className="text-sm font-medium text-blue-600">
                {maintenanceType}
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline Line */}
          <div className={cn(
            "absolute w-0.5 bg-gray-200",
            language === 'ar' 
              ? "right-6 top-0 bottom-0" 
              : "left-6 top-0 bottom-0"
          )} />
          
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <div
                key={index}
                className={cn(
                  "relative flex items-start gap-4",
                  language === 'ar' ? 'flex-row-reverse' : ''
                )}
              >
                {/* Stage Icon */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2",
                  getStageColor(stage.status)
                )}>
                  {getStageIcon(stage.status)}
                </div>

                {/* Stage Content */}
                <div className={cn(
                  "flex-1 min-h-12 pb-6",
                  language === 'ar' ? 'text-right' : ''
                )}>
                  <div className={cn(
                    "flex items-center gap-2 mb-2",
                    language === 'ar' ? 'flex-row-reverse justify-end' : ''
                  )}>
                    <h4 className="font-medium text-gray-900">{stage.name}</h4>
                    {getStatusBadge(stage.status)}
                  </div>

                  {stage.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {stage.description}
                    </p>
                  )}

                  <div className={cn(
                    "grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500",
                    language === 'ar' ? 'text-right' : ''
                  )}>
                    {stage.date && (
                      <div>
                        <span className="font-medium">
                          {language === 'ar' ? 'التاريخ:' : 'Date:'}
                        </span>{' '}
                        {formatDate(stage.date)}
                      </div>
                    )}
                    
                    {stage.assignedTo && (
                      <div>
                        <span className="font-medium">
                          {language === 'ar' ? 'المسؤول:' : 'Assigned to:'}
                        </span>{' '}
                        {stage.assignedTo}
                      </div>
                    )}
                    
                    {stage.cost && (
                      <div>
                        <span className="font-medium">
                          {language === 'ar' ? 'التكلفة:' : 'Cost:'}
                        </span>{' '}
                        {formatCurrency(stage.cost)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 