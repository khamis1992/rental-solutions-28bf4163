import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, Car, Clock, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

// Single metric card component matching Quick Actions design
const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor?: string;
  isAlert?: boolean;
}> = ({ title, value, icon: Icon, iconColor, bgColor = "bg-gray-100", isAlert = false }) => {
  return (
    <Card className={cn(
      "p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow",
      isAlert && "border-red-200 bg-red-50"
    )}>
      <div className="flex items-center justify-between" dir="rtl">
        <div className="text-right flex-1">
          <p className="text-sm text-muted-foreground text-right mb-1">{title}</p>
          <p className="text-2xl font-bold text-right">{value}</p>
        </div>
        <div className={cn(
          "p-3 rounded-full shrink-0 mr-4",
          bgColor,
          iconColor
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};

export const RealTimeStatsWidget: React.FC<{ className?: string }> = ({ className }) => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['realTimeStats'],
    queryFn: fetchRealTimeStats,
    refetchInterval: isAutoRefresh ? 30000 : false,
    staleTime: 25000,
  });

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header matching Quick Actions style */}
      <div className="flex items-center justify-between" dir="rtl">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching} className="h-8 w-8 p-0">
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
          <Badge variant={isAutoRefresh ? "default" : "secondary"} className="cursor-pointer" onClick={() => setIsAutoRefresh(!isAutoRefresh)}>
            <Activity className="h-3 w-3 ml-1" />
            {isAutoRefresh ? 'مباشر' : 'متوقف'}
          </Badge>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-semibold text-right">الإحصائيات</h3>
          {stats && <p className="text-sm text-muted-foreground text-right mt-1">آخر تحديث: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString('ar-QA') : 'غير محدد'}</p>}
        </div>
      </div>

      {/* Statistics cards matching Quick Actions design */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
          <MetricCard
            title="إيرادات اليوم"
            value={`${(stats.todayRevenue || 0).toLocaleString()} ر.ق`}
            icon={DollarSign}
            iconColor="text-green-500"
            bgColor="bg-green-100"
          />
          
          <MetricCard
            title="العقود النشطة"
            value={(stats.activeContracts || 0).toString()}
            icon={Activity}
            iconColor="text-blue-500"
            bgColor="bg-blue-100"
          />
          
          <MetricCard
            title="المركبات المتاحة"
            value={(stats.availableVehicles || 0).toString()}
            icon={Car}
            iconColor="text-purple-500"
            bgColor="bg-purple-100"
          />
          
          <MetricCard
            title="دفعات اليوم"
            value={(stats.todayPayments || 0).toString()}
            icon={DollarSign}
            iconColor="text-orange-500"
            bgColor="bg-orange-100"
          />
          
          <MetricCard
            title="صيانة معلقة"
            value={(stats.pendingMaintenance || 0).toString()}
            icon={AlertTriangle}
            iconColor="text-yellow-500"
            bgColor="bg-yellow-100"
            isAlert={stats.pendingMaintenance > 5}
          />
          
          <MetricCard
            title="دفعات متأخرة"
            value={(stats.overduePayments || 0).toString()}
            icon={AlertTriangle}
            iconColor="text-red-500"
            bgColor="bg-red-100"
            isAlert={stats.overduePayments > 0}
          />
          
          <MetricCard
            title="عملاء جدد اليوم"
            value={(stats.newCustomersToday || 0).toString()}
            icon={Users}
            iconColor="text-indigo-500"
            bgColor="bg-indigo-100"
          />
        </div>
      )}
    </div>
  );
};
