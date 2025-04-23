
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Wrench, CalendarCheck, CarFront } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleStatus } from '@/types/vehicle';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  className?: string;
}

const StatCard = ({ title, value, icon, description, trend, className }: StatCardProps) => (
  <Card className={cn("overflow-hidden", className)}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold">{value.toLocaleString()}</h3>
            {trend !== undefined && (
              <span className={cn(
                "text-xs font-medium",
                trend >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {trend >= 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-2.5">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface VehicleStatsProps {
  data: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    other: number;
  };
}

const VehicleStats: React.FC<VehicleStatsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Vehicles"
        value={data.total}
        icon={<Car className="h-5 w-5 text-primary" />}
        className="bg-blue-50/50 border-blue-100"
      />
      <StatCard
        title="Available"
        value={data.available}
        icon={<CarFront className="h-5 w-5 text-green-500" />}
        className="bg-green-50/50 border-green-100"
      />
      <StatCard
        title="Rented"
        value={data.rented}
        icon={<CalendarCheck className="h-5 w-5 text-amber-500" />}
        className="bg-amber-50/50 border-amber-100"
      />
      <StatCard
        title="In Maintenance"
        value={data.maintenance}
        icon={<Wrench className="h-5 w-5 text-red-500" />}
        className="bg-red-50/50 border-red-100"
      />
    </div>
  );
};

export default VehicleStats;
