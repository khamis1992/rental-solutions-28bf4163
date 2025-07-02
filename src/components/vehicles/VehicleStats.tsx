
// @ts-nocheck
/* eslint-disable */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Car, Construction, ShieldAlert, CircleDollarSign, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
  url?: string;
}

const StatCard = ({ title, value, description, icon, color, loading, url }: StatCardProps) => {
  const content = (
    <Card className="hover:shadow-md transition-shadow" dir="rtl">
      <CardHeader className="flex items-center justify-between pb-2 flex-row-reverse">
        <div className={`p-2 rounded-full ${color}`}>
          {icon}
        </div>
        <CardTitle className="text-sm font-medium text-muted-foreground text-right">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-1/2" />
        ) : (
          <div className="text-2xl font-bold text-right">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  if (url) {
    return <Link to={url}>{content}</Link>;
  }

  return content;
};

export function VehicleStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vehicleStats'],
    queryFn: async () => {
      // Get total vehicle count
      const { count: totalCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });
      
      // Get available vehicles count
      const { count: availableCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');
      
      // Get rented vehicles count
      const { count: rentedCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rented');
      
      // Get maintenance vehicles count
      const { count: maintenanceCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'maintenance');
      
      // Get issues count (stolen, accident)
      const { count: issuesCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .in('status', ['stolen', 'accident', 'police_station']);
      
      return {
        total: totalCount || 0,
        available: availableCount || 0,
        rented: rentedCount || 0,
        maintenance: maintenanceCount || 0,
        issues: issuesCount || 0
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const utilization = stats ? Math.round((stats.rented / (stats.total || 1)) * 100) : 0;
  
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" dir="rtl">
      <StatCard
        title="إجمالي الأسطول"
        value={stats?.total || 0}
        description="العدد الإجمالي للمركبات"
        icon={<Truck className="h-4 w-4 text-slate-600" />}
        color="bg-slate-100"
        loading={isLoading}
        url="/vehicles?status=all"
      />
      
      <StatCard
        title="متاحة"
        value={stats?.available || 0}
        description="جاهزة للإيجار"
        icon={<Car className="h-4 w-4 text-emerald-600" />}
        color="bg-emerald-100"
        loading={isLoading}
        url="/vehicles?status=available"
      />
      
      <StatCard
        title="مؤجرة"
        value={stats?.rented || 0}
        description="حالياً مع العملاء"
        icon={<CircleDollarSign className="h-4 w-4 text-blue-600" />}
        color="bg-blue-100"
        loading={isLoading}
        url="/vehicles?status=rented"
      />
      
      <StatCard
        title="قيد الصيانة"
        value={stats?.maintenance || 0}
        description="تحت الإصلاح أو الخدمة"
        icon={<Construction className="h-4 w-4 text-amber-600" />}
        color="bg-amber-100"
        loading={isLoading}
        url="/vehicles?status=maintenance"
      />
      
      <StatCard
        title="معدل استخدام الأسطول"
        value={`${utilization}%`}
        description="نسبة المركبات المؤجرة"
        icon={<ShieldAlert className="h-4 w-4 text-purple-600" />}
        color="bg-purple-100"
        loading={isLoading}
      />
    </div>
  );
}
