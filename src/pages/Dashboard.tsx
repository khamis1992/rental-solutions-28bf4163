
import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { useDashboard } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, RefreshCcw } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { toast } from 'sonner';
import { runPaymentScheduleMaintenanceJob } from '@/lib/supabase';

// Define types for our chart data
interface RevenueChartData {
  name: string; 
  revenue: number;
}

interface ActivityData {
  name: string;
  value: number;
}

const Dashboard = () => {
  const [tab, setTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);

  const { 
    dashboardStats,
    dashboardCharts,
    dashboardActivity,
    isLoadingStats,
    isLoadingCharts,
    isLoadingActivity,
    refreshDashboard
  } = useDashboard({ dateRange });

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };

  const handleRefreshData = () => {
    refreshDashboard();
  };

  const handleRunMaintenance = async () => {
    setIsRunningMaintenance(true);
    try {
      const result = await runPaymentScheduleMaintenanceJob();
      if (result.success) {
        toast({ title: "Maintenance completed", description: result.message, variant: "default" });
      } else {
        toast({ title: "Maintenance failed", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to run maintenance job", variant: "destructive" });
      console.error(error);
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  // Safely type our chart data
  const prepareRevenueData = (): RevenueChartData[] => {
    if (!dashboardCharts?.monthlyRevenue) return [];
    
    return dashboardCharts.monthlyRevenue.map(item => ({
      name: item.month || '',
      revenue: typeof item.revenue === 'number' ? item.revenue : 0
    }));
  };

  const prepareActivityData = (): ActivityData[] => {
    if (!dashboardActivity?.dailyActivity) return [];
    
    return dashboardActivity.dailyActivity.map(item => ({
      name: item.date || '',
      value: item.count || 0
    }));
  };

  const revenueData = prepareRevenueData();
  const activityData = prepareActivityData();

  return (
    <PageContainer 
      title="Dashboard" 
      description="Overview of your rental business"
      actions={
        <div className="flex gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          <Button variant="outline" size="icon" onClick={handleRefreshData}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingStats ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Vehicles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.vehiclesCount || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {dashboardStats?.availableVehicles || 0} available
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Agreements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.activeAgreements || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {dashboardStats?.agreementsEndingSoon || 0} ending soon
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.customersCount || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {dashboardStats?.newCustomers || 0} new this month
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Monthly Revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardStats?.currentMonthRevenue.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {dashboardStats?.revenueChangePercent > 0 ? '+' : ''}
                    {dashboardStats?.revenueChangePercent.toFixed(1) || '0'}% from last month
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs defaultValue="overview" value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Monthly revenue for the selected period</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {isLoadingCharts ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#3498db" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Daily system activity</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {isLoadingActivity ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analysis</CardTitle>
                <CardDescription>Detailed view of revenue streams</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoadingCharts ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#3498db" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>User and system activity over time</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoadingActivity ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>Run maintenance tasks to ensure system health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Payment Schedule Maintenance</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run this task to check for and generate missing payments, fix overlapping 
                    agreement issues, and ensure all payment schedules are correctly configured.
                    This is recommended to run weekly.
                  </p>
                  <Button 
                    onClick={handleRunMaintenance}
                    disabled={isRunningMaintenance}
                  >
                    {isRunningMaintenance ? (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      "Run Payment Maintenance"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
