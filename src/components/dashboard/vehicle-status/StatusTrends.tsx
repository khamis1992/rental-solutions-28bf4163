import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { VehicleStatusData } from './types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface StatusTrendsProps {
  data: VehicleStatusData;
  trends: {
    weeklyGrowth: number;
    utilizationRate: number;
    maintenanceEfficiency: number;
    availabilityTrend: number[];
    revenueImpact: number;
  };
  chartData: Array<{
    name: string;
    value: number;
    color: string;
    key: string;
    percentage: number;
  }>;
}

export const StatusTrends: React.FC<StatusTrendsProps> = ({
  data,
  trends,
  chartData
}) => {
  const { language } = useLanguage();

  // Generate mock weekly data for trends
  const weeklyData = trends.availabilityTrend.map((value, index) => ({
    day: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'][index],
    availability: value,
    utilization: 100 - value,
    maintenance: Math.random() * 10 + 5
  }));

  const trendMetrics = [
    {
      title: 'النمو الأسبوعي',
      value: trends.weeklyGrowth,
      unit: '%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      isPositive: trends.weeklyGrowth > 0
    },
    {
      title: 'كفاءة الصيانة',
      value: trends.maintenanceEfficiency,
      unit: '%',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      isPositive: trends.maintenanceEfficiency > 90
    },
    {
      title: 'تأثير الإيرادات',
      value: trends.revenueImpact,
      unit: '%',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      isPositive: trends.revenueImpact > 10
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Trend Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trendMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.isPositive ? TrendingUp : TrendingDown;
          
          return (
            <div 
              key={index}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                metric.bgColor,
                metric.borderColor
              )}
            >
              <div className={cn(
                "flex items-center justify-between mb-3",
                language === 'ar' && 'flex-row-reverse'
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  language === 'ar' && 'flex-row-reverse'
                )}>
                  <Icon className={cn("h-5 w-5", metric.color)} />
                  <span className="text-sm font-medium text-foreground">
                    {metric.title}
                  </span>
                </div>
                <Badge 
                  variant={metric.isPositive ? "default" : "destructive"}
                  className="text-xs"
                >
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {metric.isPositive ? 'إيجابي' : 'يحتاج تحسين'}
                </Badge>
              </div>
              
              <div className={cn(
                "flex items-baseline gap-1",
                language === 'ar' && 'flex-row-reverse'
              )}>
                <span className={cn("text-2xl font-bold", metric.color)}>
                  {metric.value}
                </span>
                <span className={cn("text-sm text-muted-foreground", metric.color)}>
                  {metric.unit}
                </span>
              </div>
              
              <Progress 
                value={metric.value} 
                className="mt-2 h-2"
              />
            </div>
          );
        })}
      </div>

      {/* Weekly Trends Chart */}
      <div className="bg-background/50 border border-border/30 rounded-xl p-6">
        <div className={cn(
          "flex items-center justify-between mb-6",
          language === 'ar' && 'flex-row-reverse'
        )}>
          <div className={cn(
            "flex items-center gap-3",
            language === 'ar' && 'flex-row-reverse'
          )}>
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                اتجاهات الأسبوع
              </h3>
              <p className="text-sm text-muted-foreground">
                تحليل الأداء خلال الأسبوع الحالي
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>متاحة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>مؤجرة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>صيانة</span>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorAvailability" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="availability"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorAvailability)"
                strokeWidth={2}
                name="متاحة"
              />
              <Area
                type="monotone"
                dataKey="utilization"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorUtilization)"
                strokeWidth={2}
                name="مؤجرة"
              />
              <Area
                type="monotone"
                dataKey="maintenance"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorMaintenance)"
                strokeWidth={2}
                name="صيانة"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution Analysis */}
      <div className="bg-background/50 border border-border/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 text-right">
          تحليل توزيع الحالات
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartData.map((status, index) => {
            const efficiency = status.key === 'available' ? 95 : 
                              status.key === 'rented' ? 88 : 
                              status.key === 'maintenance' ? 72 : 65;
            
            return (
              <div key={index} className="p-4 bg-secondary/20 rounded-lg">
                <div className={cn(
                  "flex items-center justify-between mb-2",
                  language === 'ar' && 'flex-row-reverse'
                )}>
                  <span className="font-medium text-foreground">{status.name}</span>
                  <Badge variant="outline" style={{ borderColor: status.color, color: status.color }}>
                    {status.percentage}%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className={cn(
                    "flex justify-between text-sm text-muted-foreground",
                    language === 'ar' && 'flex-row-reverse'
                  )}>
                    <span>العدد: {status.value}</span>
                    <span>الكفاءة: {efficiency}%</span>
                  </div>
                  
                  <Progress 
                    value={efficiency} 
                    className="h-2"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};