
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

export const RealTimeStatsWidget: React.FC<{ className?: string }> = ({ className }) => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['realTimeStats'],
    queryFn: fetchRealTimeStats,
    refetchInterval: isAutoRefresh ? 30000 : false,
    staleTime: 25000,
  });

  if (isLoading && !stats) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded"></div>;
  }

  const statsData = [
    {
      title: "إيرادات اليوم",
      value: `${stats?.todayRevenue?.toLocaleString() || 0} ر.ق`,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "العقود النشطة",
      value: stats?.activeContracts || 0,
      icon: Activity,
      color: "text-blue-600"
    },
    {
      title: "المركبات المتاحة",
      value: stats?.availableVehicles || 0,
      icon: Car,
      color: "text-emerald-600"
    },
    {
      title: "دفعات اليوم",
      value: stats?.todayPayments || 0,
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "صيانة معلقة",
      value: stats?.pendingMaintenance || 0,
      icon: Clock,
      color: stats?.pendingMaintenance && stats.pendingMaintenance > 5 ? "text-red-600" : "text-amber-600"
    },
    {
      title: "دفعات متأخرة",
      value: stats?.overduePayments || 0,
      icon: AlertTriangle,
      color: stats?.overduePayments && stats.overduePayments > 0 ? "text-red-600" : "text-amber-600"
    },
    {
      title: "عملاء جدد اليوم",
      value: stats?.newCustomersToday || 0,
      icon: Users,
      color: "text-indigo-600"
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with controls */}
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
        {stats && <p className="text-sm text-muted-foreground text-right">آخر تحديث: {stats.lastUpdated.toLocaleTimeString('ar-QA')}</p>}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
        {statsData.map((stat, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground text-right">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold mt-2 text-right">
                    {stat.value}
                  </h3>
                </div>
                <div className={cn(
                  "p-3 rounded-full shrink-0 bg-primary/10",
                  stat.color
                )}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
