import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, Car, Clock, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatQatarRiyal } from '@/utils/arabic-rtl-utils';

interface RealTimeStats {
  todayRevenue: number;
  todayRevenueChange: number;
  activeContracts: number;
  availableVehicles: number;
  todayPayments: number;
  pendingMaintenance: number;
  overduePayments: number;
  newCustomersToday: number;
  lastUpdated: Date;
}

const fetchRealTimeStats = async (): Promise<RealTimeStats> => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const { data: todayPayments } = await supabase
    .from('unified_payments')
    .select('amount')
    .eq('status', 'paid')
    .gte('payment_date', todayStr + ' 00:00:00')
    .lt('payment_date', todayStr + ' 23:59:59');

  const { data: activeContracts } = await supabase
    .from('leases')
    .select('id')
    .eq('status', 'active');

  const { data: availableVehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'available');

  const { data: maintenanceVehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'maintenance');

  const { data: overduePayments } = await supabase
    .from('unified_payments')
    .select('id')
    .eq('status', 'pending')
    .lt('due_date', todayStr);

  const { data: newCustomers } = await supabase
    .from('profiles')
    .select('id')
    .gte('created_at', todayStr + ' 00:00:00')
    .lt('created_at', todayStr + ' 23:59:59');

  const todayRevenue = todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    todayRevenue,
    todayRevenueChange: 0,
    activeContracts: activeContracts?.length || 0,
    availableVehicles: availableVehicles?.length || 0,
    todayPayments: todayPayments?.length || 0,
    pendingMaintenance: maintenanceVehicles?.length || 0,
    overduePayments: overduePayments?.length || 0,
    newCustomersToday: newCustomers?.length || 0,
    lastUpdated: new Date()
  };
};

// Professional metric card component with modern design
const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  isAlert?: boolean;
  trend?: number;
  description?: string;
}> = ({ title, value, icon: Icon, iconColor, bgColor, isAlert = false, trend, description }) => {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-muted/20 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-primary/30",
      isAlert && "border-destructive/40 bg-gradient-to-br from-destructive/5 via-background/95 to-destructive/10 hover:border-destructive/50"
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-secondary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative flex items-center justify-between" dir="rtl">
        <div className="text-right flex-1">
          <p className="text-sm font-medium text-muted-foreground text-right mb-2 leading-tight">{title}</p>
          <div className="flex items-baseline justify-end gap-2 mb-1">
            <p className="text-2xl font-bold text-foreground text-right tabular-nums">{value}</p>
            {trend !== undefined && trend !== 0 && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend > 0 ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
              )}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground/80 text-right mt-1">{description}</p>}
        </div>
        
        <div className={cn(
          "relative shrink-0 mr-4 p-3 rounded-xl border border-current/20 group-hover:scale-110 transition-transform duration-300",
          bgColor,
          iconColor,
          isAlert && "animate-pulse"
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-current/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Icon className="h-5 w-5 relative z-10" />
        </div>
      </div>
      
      {/* Status indicator for alerts */}
      {isAlert && (
        <div className="absolute top-2 left-2 w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export const RealTimeStatsWidget: React.FC<{ className?: string }> = ({ className }) => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const { language } = useLanguage();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['realTimeStats'],
    queryFn: fetchRealTimeStats,
    refetchInterval: isAutoRefresh ? 30000 : false,
    staleTime: 25000,
  });

  // Professional loading state
  if (isLoading && !stats) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background border-border/40 shadow-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-secondary/[0.02]"></div>
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
        
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted/50 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-muted/30 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 bg-muted/50 rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-muted/50 rounded animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(7)].map((_, index) => (
              <div 
                key={index} 
                className="h-24 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl animate-pulse"
                style={{ animationDelay: `${index * 100}ms` }}
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300",
      className
    )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-secondary/[0.02]"></div>
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
      
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-sm"></div>
              <div className="relative p-2 rounded-xl bg-background/80 border border-primary/20 shadow-sm">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-right text-foreground">
                الإحصائيات المباشرة
              </CardTitle>
              <CardDescription className="text-right text-muted-foreground mt-1">
                {stats ? `آخر تحديث: ${new Date(stats.lastUpdated).toLocaleTimeString('ar-QA')}` : 'بيانات آنية ومؤشرات'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isAutoRefresh ? "default" : "secondary"} 
              className="cursor-pointer hover:scale-105 transition-transform duration-200 px-3 py-1" 
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            >
              <Activity className="h-3 w-3 ml-1" />
              {isAutoRefresh ? 'مباشر' : 'متوقف'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()} 
              disabled={isRefetching} 
              className="h-9 w-9 p-0 hover:bg-accent/50 hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefetching && "animate-spin text-primary")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="إيرادات اليوم"
              value={formatQatarRiyal(stats.todayRevenue || 0)}
              icon={DollarSign}
              iconColor="text-green-600 dark:text-green-400"
              bgColor="bg-green-100 dark:bg-green-900/30"
              description="إجمالي الدفعات المستلمة"
            />
            
            <MetricCard
              title="العقود النشطة"
              value={(stats.activeContracts || 0).toString()}
              icon={Activity}
              iconColor="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-100 dark:bg-blue-900/30"
              description="اتفاقيات سارية المفعول"
            />
            
            <MetricCard
              title="المركبات المتاحة"
              value={(stats.availableVehicles || 0).toString()}
              icon={Car}
              iconColor="text-purple-600 dark:text-purple-400"
              bgColor="bg-purple-100 dark:bg-purple-900/30"
              description="جاهزة للتأجير"
            />
            
            <MetricCard
              title="دفعات اليوم"
              value={(stats.todayPayments || 0).toString()}
              icon={DollarSign}
              iconColor="text-orange-600 dark:text-orange-400"
              bgColor="bg-orange-100 dark:bg-orange-900/30"
              description="عدد المعاملات المكتملة"
            />
            
            <MetricCard
              title="صيانة معلقة"
              value={(stats.pendingMaintenance || 0).toString()}
              icon={AlertTriangle}
              iconColor="text-yellow-600 dark:text-yellow-400"
              bgColor="bg-yellow-100 dark:bg-yellow-900/30"
              isAlert={stats.pendingMaintenance > 5}
              description="مركبات تحتاج صيانة"
            />
            
            <MetricCard
              title="دفعات متأخرة"
              value={(stats.overduePayments || 0).toString()}
              icon={AlertTriangle}
              iconColor="text-red-600 dark:text-red-400"
              bgColor="bg-red-100 dark:bg-red-900/30"
              isAlert={stats.overduePayments > 0}
              description="تحتاج متابعة فورية"
            />
            
            <MetricCard
              title="عملاء جدد اليوم"
              value={(stats.newCustomersToday || 0).toString()}
              icon={Users}
              iconColor="text-indigo-600 dark:text-indigo-400"
              bgColor="bg-indigo-100 dark:bg-indigo-900/30"
              description="انضموا للنظام اليوم"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
