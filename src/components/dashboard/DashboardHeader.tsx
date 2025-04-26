import React from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { LayoutDashboard, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface DashboardHeaderProps {
  currentDate: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentDate,
  isRefreshing,
  onRefresh
}) => {
  const navigate = useNavigate();
  return <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <SectionHeader title="Dashboard" description={`Overview of your rental operations • ${currentDate}`} icon={LayoutDashboard} />
      </div>
      <div className="flex items-center space-x-2">
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={isRefreshing} className="h-9">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        
      </div>
    </div>;
};