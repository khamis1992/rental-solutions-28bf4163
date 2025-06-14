
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardStats from './DashboardStats';
import RevenueChart from './RevenueChart';
import VehicleStatusChart from './VehicleStatusChart';
import RecentActivity from './RecentActivity';
import { DashboardStats as DashboardStatsType, RecentActivity as RecentActivityType } from '@/hooks/use-dashboard';

interface DashboardContentProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  stats?: DashboardStatsType;
  revenue: { name: string; revenue: number; }[];
  activity: RecentActivityType[];
  collapsedSections: {[key: string]: boolean};
  onToggleSection: (section: string) => void;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  isLoading,
  isError,
  error,
  stats,
  revenue,
  activity,
  collapsedSections,
  onToggleSection
}) => {
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Failed to load dashboard data. Please try again later.
        {error && <p className="text-sm mt-1">{error.toString()}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('kpis')}
          >
            {collapsedSections['kpis'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsedSections['kpis'] && <DashboardStats stats={stats} loading={isLoading} />}
      </div>
      
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Fleet Status</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-background">
              {isLoading ? "Loading..." : `${stats?.vehicleStats.total || 0} Total Vehicles`}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => onToggleSection('fleet')}
            >
              {collapsedSections['fleet'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {!collapsedSections['fleet'] && (
          isLoading ? <Skeleton className="h-[300px] w-full rounded-lg" /> : <VehicleStatusChart data={stats?.vehicleStats} />
        )}
      </div>
      
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Revenue Overview</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-background">
              Last 6 Months
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => onToggleSection('revenue')}
            >
              {collapsedSections['revenue'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {!collapsedSections['revenue'] && (
          isLoading ? <Skeleton className="h-[350px] w-full rounded-lg" /> : <RevenueChart data={revenue} fullWidth={true} />
        )}
      </div>
      
      <div className="dashboard-section animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onToggleSection('activity')}
          >
            {collapsedSections['activity'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsedSections['activity'] && (
          isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : <RecentActivity activities={activity} />
        )}
      </div>
    </div>
  );
};
