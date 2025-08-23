// @ts-nocheck
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Shield
} from 'lucide-react';
import { statusConfig } from './status-config';
import { VehicleStatusData } from './types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface StatusMetricsProps {
  data: VehicleStatusData;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  utilizationRate: number;
  availabilityRate: number;
  onStatusClick: (data: any) => void;
  showAdvancedMetrics?: boolean;
}

export const StatusMetrics: React.FC<StatusMetricsProps> = ({
  data,
  selectedFilter,
  onFilterChange,
  utilizationRate,
  availabilityRate,
  onStatusClick,
  showAdvancedMetrics = false
}) => {
  const { language } = useLanguage();

  const filterOptions = [
    { value: 'all', label: 'جميع المركبات', icon: Activity },
    { value: 'available', label: 'متاحة', icon: CheckCircle },
    { value: 'rented', label: 'مؤجرة', icon: Activity },
    { value: 'issues', label: 'تحتاج انتباه', icon: AlertTriangle }
  ];

  const keyMetrics = [
    {
      label: 'معدل الاستخدام',
      value: utilizationRate,
      target: 85,
      icon: TrendingUp,
      trend: 2.3,
      color: utilizationRate >= 80 ? 'text-green-600' : utilizationRate >= 60 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      label: 'معدل التوفر',
      value: availabilityRate,
      target: 20,
      icon: CheckCircle,
      trend: -1.2,
      color: availabilityRate >= 15 ? 'text-green-600' : availabilityRate >= 10 ? 'text-yellow-600' : 'text-red-600'
    }
  ];

  const getFilteredStatuses = () => {
    return statusConfig.filter(status => {
      const count = data[status.key as keyof typeof data] || 0;
      if (count === 0) return false;
      
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'issues') {
        return ['maintenance', 'accident', 'stolen', 'police_station'].includes(status.key);
      }
      if (selectedFilter === 'available') {
        return ['available', 'reserved'].includes(status.key);
      }
      if (selectedFilter === 'rented') {
        return status.key === 'rented';
      }
      return false;
    });
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Filter Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">تصفية البيانات</h3>
          <Badge variant="outline" className="text-xs">
            {getFilteredStatuses().length} فئة
          </Badge>
        </div>
        
        <Select value={selectedFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر التصفية" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(option => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Metrics */}
      {showAdvancedMetrics && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">مؤشرات الأداء</h3>
          <div className="space-y-3">
            {keyMetrics.map((metric, index) => {
              const Icon = metric.icon;
              const TrendIcon = metric.trend > 0 ? TrendingUp : TrendingDown;
              const progressPercentage = (metric.value / metric.target) * 100;
              
              return (
                <div key={index} className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", metric.color)} />
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn("text-lg font-bold", metric.color)}>
                        {metric.value}%
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        <TrendIcon className={cn(
                          "h-3 w-3", 
                          metric.trend > 0 ? "text-green-500" : "text-red-500"
                        )} />
                        <span className={metric.trend > 0 ? "text-green-600" : "text-red-600"}>
                          {Math.abs(metric.trend)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(progressPercentage, 100)} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>الحالي: {metric.value}%</span>
                    <span>الهدف: {metric.target}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">تفاصيل الحالات</h3>
          <Badge variant="secondary" className="text-xs">
            إجمالي: {data.total}
          </Badge>
        </div>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {getFilteredStatuses().map((status) => {
            const count = data[status.key as keyof typeof data] || 0;
            const percentage = data.total ? Math.round((count / data.total) * 100) : 0;
            const Icon = status.icon;
            
            return (
              <div
                key={status.key}
                className={cn(
                  "group p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                  "hover:shadow-md hover:scale-[1.02]",
                  status.key === 'stolen' || status.key === 'accident' 
                    ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10" 
                    : status.key === 'maintenance'
                    ? "bg-warning/5 border-warning/20 hover:bg-warning/10"
                    : status.key === 'available'
                    ? "bg-success/5 border-success/20 hover:bg-success/10"
                    : "bg-secondary/10 border-border/30 hover:bg-secondary/20"
                )}
                onClick={() => onStatusClick({ filterValue: status.filterValue })}
              >
                <div className={cn(
                  "flex items-center justify-between",
                  language === 'ar' && 'flex-row-reverse'
                )}>
                  <div className={cn(
                    "flex items-center gap-3",
                    language === 'ar' && 'flex-row-reverse'
                  )}>
                    <div 
                      className="p-2 rounded-lg transition-colors group-hover:scale-110"
                      style={{ 
                        backgroundColor: `${status.color}20`,
                        border: `1px solid ${status.color}40`
                      }}
                    >
                      <Icon 
                        className="h-4 w-4 transition-colors"
                        style={{ color: status.color }}
                      />
                    </div>
                    <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                      <div className="font-semibold text-foreground text-sm">
                        {status.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {status.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "flex flex-col items-end gap-1",
                    language === 'ar' && 'items-start'
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {count}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-0.5"
                        style={{ 
                          borderColor: status.color,
                          color: status.color 
                        }}
                      >
                        {percentage}%
                      </Badge>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-1 w-16"
                      style={{ 
                        backgroundColor: `${status.color}20`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};