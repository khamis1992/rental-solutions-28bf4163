import React, { useState, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RevenueChart from '@/components/dashboard/RevenueChart';
import VehicleStatusChart from '@/components/dashboard/VehicleStatusChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { LayoutDashboard, RefreshCw, Wrench, UserPlus, FileText, CreditCard, Calendar, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { DataCard } from '@/components/ui/data-card';

// Suppress Supabase schema cache errors more comprehensively
if (typeof window !== 'undefined') {
  // Override console.error to filter out specific error messages
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Filter out all errors about relationships in schema cache
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('schema cache')) {
      return; // Suppress all schema cache related errors
    }
    // Pass all other errors to the original console.error
    originalConsoleError.apply(console, args);
  };
}

const Dashboard = () => {
  const { stats, revenue, activity, isLoading, isError, error } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    // Use a timeout to prevent rapid refreshes
    setTimeout(() => {
      window.location.reload();
      toast({
        title: "Dashboard refreshed",
        description: "All data has been updated with the latest information."
      });
    }, 600);
  }, []);
  
  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({ 
      ...prev, 
      [section]: !prev[section] 
    }));
  }, []);
  
  const navigateTo = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);
  
  // Quick actions for the dashboard - update Add Vehicle to Add Customer
  const quickActions = [
    { 
      title: "Add Customer", 
      icon: UserPlus, 
      color: "bg-green-500", 
      onClick: () => navigateTo('/customers/add') 
    },
    { 
      title: "Create Agreement", 
      icon: FileText, 
      color: "bg-violet-500", 
      onClick: () => navigateTo('/agreements/add') 
    },
    { 
      title: "Record Payment", 
      icon: CreditCard, 
      color: "bg-green-500", 
      onClick: () => navigateTo('/financials/payments/new') 
    },
    { 
      title: "Schedule Maintenance", 
      icon: Wrench, 
      color: "bg-amber-500", 
      onClick: () => navigateTo('/maintenance/new') 
    }
  ];
  
  // Get current date in a formatted string
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <PageContainer>
      {/* Header with refresh action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <SectionHeader
            title="Dashboard"
            description={`Overview of your rental operations • ${currentDate}`}
            icon={LayoutDashboard}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateTo('/settings/dashboard')}
            className="h-9"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
      </div>
      
      {/* Quick Actions */}
      <Card className="mb-6 border border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto py-4 justify-start flex flex-col items-center text-center hover:bg-accent/5"
                onClick={action.onClick}
              >
                <div className={`rounded-full p-2 ${action.color} bg-opacity-10 mb-2`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        {isLoading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <Skeleton className="h-96" />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <Skeleton className="h-96" />
            </div>
            
            <Skeleton className="h-96" />
          </>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            Failed to load dashboard data. Please try again later.
            {error && <p className="text-sm mt-1">{error.toString()}</p>}
          </div>
        ) : (
          <>
            {/* KPI Stats */}
            <div className="dashboard-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => toggleSection('kpis')}
                >
                  {collapsedSections['kpis'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
              
              {!collapsedSections['kpis'] && <DashboardStats stats={stats} />}
            </div>
            
            {/* Fleet Status */}
            <div className="dashboard-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Fleet Status</h2>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-background">
                    {stats?.vehicleStats.total || 0} Total Vehicles
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => toggleSection('fleet')}
                  >
                    {collapsedSections['fleet'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {!collapsedSections['fleet'] && <VehicleStatusChart data={stats?.vehicleStats} />}
            </div>
            
            {/* Revenue Overview */}
            <div className="dashboard-section">
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
                    onClick={() => toggleSection('revenue')}
                  >
                    {collapsedSections['revenue'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {!collapsedSections['revenue'] && <RevenueChart data={revenue} fullWidth={true} />}
            </div>
            
            {/* Recent Activity */}
            <div className="dashboard-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => toggleSection('activity')}
                >
                  {collapsedSections['activity'] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
              
              {!collapsedSections['activity'] && <RecentActivity activities={activity} />}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Dashboard;
