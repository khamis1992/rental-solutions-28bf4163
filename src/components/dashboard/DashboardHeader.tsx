
import React from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { CalendarDays, LayoutDashboard, RefreshCw, Settings, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  
  return (
    <div className="rounded-lg bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 p-6 mb-6 border border-blue-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <LayoutDashboard className="h-6 w-6 mr-2 text-primary" />
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center">
            <CalendarDays className="h-4 w-4 mr-1.5 text-muted-foreground" />
            {currentDate}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select defaultValue="today">
            <SelectTrigger className="h-9 w-[150px] bg-white">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 bg-white hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/settings/dashboard')}
            className="h-9 bg-white hover:bg-blue-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
      </div>
    </div>
  );
};
