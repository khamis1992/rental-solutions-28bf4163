// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react';
import { statusConfig } from './status-config';
import { VehicleStatusData } from './types';
import { EnhancedStatusChart } from './EnhancedStatusChart';
import { StatusMetrics } from './StatusMetrics';
import { StatusTrends } from './StatusTrends';
import { QuickStatusActions } from './QuickStatusActions';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface EnhancedVehicleStatusChartProps {
  data?: VehicleStatusData;
  loading?: boolean;
}

type ViewMode = 'overview' | 'analytics' | 'trends';
type ChartType = 'donut' | 'pie' | 'bar';

export const EnhancedVehicleStatusChart: React.FC<EnhancedVehicleStatusChartProps> = ({ 
  data, 
  loading = false 
}) => {
  // ✅ ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [chartType, setChartType] = useState<ChartType>('donut');
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  // محاكاة بيانات الاتجاهات والتحليلات
  const mockTrends = useMemo(() => ({
    weeklyGrowth: 2.5,
    utilizationRate: 82.3,
    maintenanceEfficiency: 95.8,
    availabilityTrend: [78, 82, 85, 79, 88, 84, 82],
    revenueImpact: 15.2
  }), []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleFilterChange = useCallback((value: string) => {
    setSelectedFilter(value);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Memoized computed values
  const processedData = useMemo(() => {
    if (!data) return null;
    
    const normalizedData = { ...data };
    
    statusConfig.forEach(status => {
      const statusKey = status.key as keyof typeof normalizedData;
      if (normalizedData && normalizedData[statusKey] === undefined) {
        (normalizedData as any)[statusKey] = 0;
      }
    });
    
    const chartData = statusConfig
      .filter(status => {
        const statusKey = status.key as keyof typeof normalizedData;
        return normalizedData && normalizedData[statusKey] !== undefined && normalizedData[statusKey] > 0;
      })
      .filter(status => selectedFilter === 'all' || 
               (selectedFilter === 'issues' && 
                ['maintenance', 'accident', 'stolen', 'police_station'].includes(status.key)) ||
               (selectedFilter === 'available' && 
                ['available', 'reserved'].includes(status.key)) ||
               (selectedFilter === 'rented' && 
                status.key === 'rented'))
      .map(status => ({
        name: status.name,
        value: normalizedData[status.key as keyof typeof normalizedData] || 0,
        color: status.color,
        key: status.key,
        filterValue: status.filterValue,
        percentage: Math.round(((normalizedData[status.key as keyof typeof normalizedData] || 0) / (data?.total || 1)) * 100)
      }));
    
    const criticalVehicles = (normalizedData?.stolen || 0) + 
                            (normalizedData?.accident || 0) + 
                            (normalizedData?.police_station || 0);
    
    const utilizationRate = data?.total ? Math.round(((data.rented / data.total) * 100)) : 0;
    const availabilityRate = data?.total ? Math.round(((data.available / data.total) * 100)) : 0;
    
    return {
      normalizedData,
      chartData,
      criticalVehicles,
      utilizationRate,
      availabilityRate
    };
  }, [data, selectedFilter]);

  const handleStatusClick = useCallback((statusData: any) => {
    navigate(`/vehicles?status=${statusData.filterValue}`);
  }, [navigate]);

  // ✅ NOW HANDLE CONDITIONAL RENDERING AFTER ALL HOOKS ARE ESTABLISHED
  if (loading) {
    return (
      <Card className="col-span-full lg:col-span-4 overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background border-border/40 shadow-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/3 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
            <div className="w-full lg:w-2/3">
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Return null if no data or processed data
  if (!data || !processedData) return null;

  // Destructure the memoized processed data
  const { normalizedData, chartData, criticalVehicles, utilizationRate, availabilityRate } = processedData;

  return (
    <Card 
      className="col-span-full lg:col-span-4 overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background border-border/40 shadow-sm hover:shadow-lg transition-all duration-300" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>
      </div>
      
      <CardHeader className="pb-4 relative">
        <div className={cn(
          "flex flex-col gap-4",
          language === 'ar' ? 'items-end' : 'items-start'
        )}>
          {/* Header with metrics */}
          <div className="flex items-center justify-between w-full">
            <div className={cn(
              "flex items-center gap-3",
              language === 'ar' && 'flex-row-reverse'
            )}>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className={cn(
                  "text-xl font-semibold text-foreground flex items-center gap-2",
                  language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'
                )}>
                  نظرة شاملة على حالة الأسطول
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    مباشر
                  </Badge>
                </CardTitle>
                <div className={cn(
                  "flex items-center gap-4 mt-2 text-sm text-muted-foreground",
                  language === 'ar' && 'flex-row-reverse'
                )}>
                  <span>إجمالي الأسطول: <strong>{data?.total || 0}</strong></span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    معدل الاستخدام: <strong>{utilizationRate}%</strong>
                  </span>
                </div>
              </div>
            </div>
            
            {criticalVehicles > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                تحتاج انتباه: {criticalVehicles}
              </Badge>
            )}
          </div>

          {/* View Mode Controls */}
          <div className={cn(
            "flex items-center gap-2",
            language === 'ar' && 'flex-row-reverse'
          )}>
            <div className="flex bg-secondary/30 rounded-lg p-1">
              {[
                { key: 'overview', label: 'نظرة عامة', icon: PieChart },
                { key: 'analytics', label: 'تحليلات', icon: BarChart3 },
                { key: 'trends', label: 'الاتجاهات', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={viewMode === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange(key as ViewMode)}
                  className={cn(
                    "h-8 px-3 text-xs font-medium transition-all duration-200",
                    viewMode === key && "shadow-sm bg-background text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>

            {viewMode === 'overview' && (
              <div className="flex bg-secondary/30 rounded-lg p-1">
                {[
                  { key: 'donut', icon: PieChart },
                  { key: 'bar', icon: BarChart3 }
                ].map(({ key, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={chartType === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(key as ChartType)}
                    className={cn(
                      "h-8 w-8 p-0 transition-all duration-200",
                      chartType === key && "shadow-sm bg-background"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {viewMode === 'overview' && (
          <div className={cn(
            "flex flex-col lg:flex-row items-start justify-between gap-6",
            language === 'ar' && 'lg:flex-row-reverse'
          )}>
            {/* Status Metrics Panel */}
            <div className="w-full lg:w-1/3">
              <StatusMetrics 
                data={normalizedData}
                selectedFilter={selectedFilter}
                onFilterChange={handleFilterChange}
                utilizationRate={utilizationRate}
                availabilityRate={availabilityRate}
                onStatusClick={handleStatusClick}
              />
            </div>
            
            {/* Enhanced Chart */}
            <div className="w-full lg:w-2/3 h-80 lg:h-96">
              <EnhancedStatusChart 
                data={chartData}
                chartType={chartType}
                onSegmentClick={handleStatusClick}
                showAnimations={true}
              />
            </div>
          </div>
        )}

        {viewMode === 'analytics' && (
          <StatusMetrics 
            data={normalizedData}
            selectedFilter={selectedFilter}
            onFilterChange={handleFilterChange}
            utilizationRate={utilizationRate}
            availabilityRate={availabilityRate}
            onStatusClick={handleStatusClick}
            showAdvancedMetrics={true}
          />
        )}

        {viewMode === 'trends' && (
          <StatusTrends 
            data={normalizedData}
            trends={mockTrends}
            chartData={chartData}
          />
        )}

        {/* Quick Actions Footer */}
        <div className="mt-6 pt-4 border-t border-border/40">
          <QuickStatusActions 
            criticalCount={criticalVehicles}
            availableCount={data?.available || 0}
            maintenanceCount={data?.maintenance || 0}
            onNavigate={navigate}
          />
        </div>
      </CardContent>
    </Card>
  );
};