
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Car, Construction, ShieldAlert, CircleDollarSign, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-1/2" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Fleet"
        value={stats?.total || 0}
        description="Total number of vehicles"
        icon={<Truck className="h-4 w-4 text-slate-600" />}
        color="bg-slate-100"
        loading={isLoading}
        url="/vehicles?status=all"
      />
      
      <StatCard
        title="Available"
        value={stats?.available || 0}
        description="Ready for rental"
        icon={<Car className="h-4 w-4 text-emerald-600" />}
        color="bg-emerald-100"
        loading={isLoading}
        url="/vehicles?status=available"
      />
      
      <StatCard
        title="Rented"
        value={stats?.rented || 0}
        description="Currently with customers"
        icon={<CircleDollarSign className="h-4 w-4 text-blue-600" />}
        color="bg-blue-100"
        loading={isLoading}
        url="/vehicles?status=rented"
      />
      
      <StatCard
        title="In Maintenance"
        value={stats?.maintenance || 0}
        description="Under repair or service"
        icon={<Construction className="h-4 w-4 text-amber-600" />}
        color="bg-amber-100"
        loading={isLoading}
        url="/vehicles?status=maintenance"
      />
      
      <StatCard
        title="Fleet Utilization"
        value={`${utilization}%`}
        description="Percentage of rented vehicles"
        icon={<ShieldAlert className="h-4 w-4 text-purple-600" />}
        color="bg-purple-100"
        loading={isLoading}
      />
    </div>
  );
}
