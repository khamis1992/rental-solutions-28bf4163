
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { LayoutDashboard, RefreshCw, Settings, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardHeaderProps {
  currentDate: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = memo(({
  currentDate,
  isRefreshing,
  onRefresh
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
      <div>
        <SectionHeader
          title="Dashboard"
          description="Overview of your rental operations"
          icon={LayoutDashboard}
        />
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          <span className="truncate">{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh dashboard data"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh dashboard data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/system-settings')}
                aria-label="System settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>System settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
});
