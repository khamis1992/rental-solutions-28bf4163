
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardStats from './DashboardStats';
import RevenueChart from './RevenueChart';
import VehicleStatusChart from './VehicleStatusChart';
import RecentActivity from './RecentActivity';
import { DashboardStats as DashboardStatsType, RecentActivity as RecentActivityType } from '@/hooks/use-dashboard';

interface SectionHeaderProps {
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, isCollapsed, onToggle, children }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold">{title}</h2>
    <div className="flex items-center gap-3">
      {children}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 hover:bg-slate-100"
        onClick={onToggle}
      >
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
    </div>
  </div>
);

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
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-section">
        <SectionHeader 
          title="Key Performance Indicators"
          isCollapsed={collapsedSections['kpis']} 
          onToggle={() => onToggleSection('kpis')}
        />
        {!collapsedSections['kpis'] && (
          <div className="transition-all duration-300 ease-in-out">
            <DashboardStats stats={stats} />
          </div>
        )}
      </div>
      
      <div className="dashboard-section">
        <SectionHeader 
          title="Fleet Status"
          isCollapsed={collapsedSections['fleet']} 
          onToggle={() => onToggleSection('fleet')}
        />
        {!collapsedSections['fleet'] && (
          <div className="transition-all duration-300 ease-in-out">
            <VehicleStatusChart data={stats?.vehicleStats} />
          </div>
        )}
      </div>
      
      <div className="dashboard-section">
        <SectionHeader 
          title="Revenue Overview"
          isCollapsed={collapsedSections['revenue']} 
          onToggle={() => onToggleSection('revenue')}
        />
        {!collapsedSections['revenue'] && (
          <div className="transition-all duration-300 ease-in-out">
            <RevenueChart data={revenue} fullWidth={true} />
          </div>
        )}
      </div>
      
      <div className="dashboard-section">
        <SectionHeader 
          title="Recent Activity"
          isCollapsed={collapsedSections['activity']} 
          onToggle={() => onToggleSection('activity')}
        />
        {!collapsedSections['activity'] && (
          <div className="transition-all duration-300 ease-in-out">
            <RecentActivity activities={activity} />
          </div>
        )}
      </div>
    </div>
  );
};
