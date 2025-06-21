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

  return (
    <Card className={cn("border-0 shadow-md", className)}>
      <CardHeader className="pb-2">
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
            <CardTitle className="text-lg font-medium text-right">الإحصائيات المباشرة</CardTitle>
            {stats && <p className="text-sm text-muted-foreground text-right mt-1">آخر تحديث: {stats.lastUpdated.toLocaleTimeString('ar-QA')}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" dir="rtl">
            <Card className="p-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إيرادات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayRevenue.toLocaleString()} ر.ق</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">العقود النشطة</p>
                <p className="text-2xl font-bold">{stats.activeContracts}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">المركبات المتاحة</p>
                <p className="text-2xl font-bold">{stats.availableVehicles}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">دفعات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayPayments}</p>
              </div>
            </Card>
            <Card className={cn("p-4", stats.pendingMaintenance > 5 && "border-red-200 bg-red-50")}>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">صيانة معلقة</p>
                <p className="text-2xl font-bold">{stats.pendingMaintenance}</p>
              </div>
            </Card>
            <Card className={cn("p-4", stats.overduePayments > 0 && "border-red-200 bg-red-50")}>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">دفعات متأخرة</p>
                <p className="text-2xl font-bold">{stats.overduePayments}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">عملاء جدد اليوم</p>
                <p className="text-2xl font-bold">{stats.newCustomersToday}</p>
              </div>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
