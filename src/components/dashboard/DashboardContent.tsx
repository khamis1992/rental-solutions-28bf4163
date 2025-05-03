
import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

// Create memoized section components to prevent unnecessary re-renders
const KPISection = memo(({
  isCollapsed,
  onToggle,
  stats,
  isLoading
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  stats?: DashboardStatsType;
  isLoading: boolean;
}) => (
  <div className="dashboard-section animate-fade-in">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand KPIs section" : "Collapse KPIs section"}
      >
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
    </div>
    {!isCollapsed && <DashboardStats stats={stats} loading={isLoading} />}
  </div>
));

KPISection.displayName = 'KPISection';

const FleetSection = memo(({
  isCollapsed,
  onToggle,
  stats,
  isLoading
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  stats?: DashboardStatsType;
  isLoading: boolean;
}) => (
  <div className="dashboard-section animate-fade-in">
    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
      <h2 className="text-lg font-semibold">Fleet Status</h2>
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="bg-background">
          {isLoading ? "Loading..." : `${stats?.vehicleStats.total || 0} Total Vehicles`}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expand fleet status section" : "Collapse fleet status section"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
    </div>
    {!isCollapsed && (
      isLoading ? <Skeleton className="h-[300px] w-full rounded-lg" /> : <VehicleStatusChart data={stats?.vehicleStats} />
    )}
  </div>
));

FleetSection.displayName = 'FleetSection';

const RevenueSection = memo(({
  isCollapsed,
  onToggle,
  revenue,
  isLoading
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  revenue: { name: string; revenue: number; }[];
  isLoading: boolean;
}) => (
  <div className="dashboard-section animate-fade-in">
    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
      <h2 className="text-lg font-semibold">Revenue Overview</h2>
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="bg-background">
          Last 6 Months
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expand revenue section" : "Collapse revenue section"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
    </div>
    {!isCollapsed && (
      isLoading ? <Skeleton className="h-[350px] w-full rounded-lg" /> : <RevenueChart data={revenue} fullWidth={true} />
    )}
  </div>
));

RevenueSection.displayName = 'RevenueSection';

const ActivitySection = memo(({
  isCollapsed,
  onToggle,
  activity,
  isLoading
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  activity: RecentActivityType[];
  isLoading: boolean;
}) => (
  <div className="dashboard-section animate-fade-in">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand activity section" : "Collapse activity section"}
      >
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
    </div>
    {!isCollapsed && (
      isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : <RecentActivity activities={activity} />
    )}
  </div>
));

ActivitySection.displayName = 'ActivitySection';

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
  // State for retry functionality
  const [isRetrying, setIsRetrying] = useState(false);

  // Handle retry when there's an error
  const handleRetry = () => {
    setIsRetrying(true);
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading dashboard data</AlertTitle>
        <AlertDescription className="mt-2">
          <p>Failed to load dashboard data. Please try again later.</p>
          {error && <p className="text-sm mt-1 mb-2 opacity-80">{error.toString()}</p>}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="mt-2"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <KPISection
        isCollapsed={!!collapsedSections['kpis']}
        onToggle={() => onToggleSection('kpis')}
        stats={stats}
        isLoading={isLoading}
      />

      <FleetSection
        isCollapsed={!!collapsedSections['fleet']}
        onToggle={() => onToggleSection('fleet')}
        stats={stats}
        isLoading={isLoading}
      />

      <RevenueSection
        isCollapsed={!!collapsedSections['revenue']}
        onToggle={() => onToggleSection('revenue')}
        revenue={revenue}
        isLoading={isLoading}
      />

      <ActivitySection
        isCollapsed={!!collapsedSections['activity']}
        onToggle={() => onToggleSection('activity')}
        activity={activity}
        isLoading={isLoading}
      />
    </div>
  );
};

// Export a memoized version of the component to prevent unnecessary re-renders
export default memo(DashboardContent);
