
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useTrafficFines, TrafficFine } from '@/hooks/use-traffic-fines';
import { AlertCircle, DollarSign, CheckCircle, Users, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { runTrafficFinesSystemHealthCheck } from '@/utils/traffic-fines-test-utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2'];

const TrafficFineAnalytics = () => {
  const [timeRange, setTimeRange] = useState('all');
  const { trafficFines, isLoading, error } = useTrafficFines();
  const [activeTab, setActiveTab] = useState('overview');
  const [healthCheckData, setHealthCheckData] = useState<any>(null);
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);

  // Run health check when tab is opened
  const performHealthCheck = async () => {
    if (healthCheckData) return; // Only run once
    
    setIsRunningHealthCheck(true);
    try {
      const results = await runTrafficFinesSystemHealthCheck();
      setHealthCheckData(results);
    } catch (error) {
      console.error("Error running health check:", error);
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'data-quality') {
      performHealthCheck();
    }
  }, [activeTab]);

  // Filter fines based on time range
  const filteredFines = useMemo(() => {
    if (!trafficFines || trafficFines.length === 0) return [];
    
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    switch (timeRange) {
      case '1month':
        return trafficFines.filter(fine => new Date(fine.violationDate) >= oneMonthAgo);
      case '3months':
        return trafficFines.filter(fine => new Date(fine.violationDate) >= threeMonthsAgo);
      case '6months':
        return trafficFines.filter(fine => new Date(fine.violationDate) >= sixMonthsAgo);
      case 'all':
      default:
        return trafficFines;
    }
  }, [trafficFines, timeRange]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!filteredFines || filteredFines.length === 0) {
      return {
        totalFines: 0,
        totalAmount: 0,
        paidFines: 0,
        paidAmount: 0,
        assignedFines: 0,
        disputedFines: 0,
        averageFineAmount: 0,
        pendingAmount: 0
      };
    }

    const paidFines = filteredFines.filter(fine => fine.paymentStatus === 'paid');
    const assignedFines = filteredFines.filter(fine => fine.customerId);
    const disputedFines = filteredFines.filter(fine => fine.paymentStatus === 'disputed');
    const pendingPaymentFines = filteredFines.filter(fine => fine.paymentStatus === 'pending');
    
    const totalAmount = filteredFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
    const paidAmount = paidFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
    const pendingAmount = pendingPaymentFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
    
    return {
      totalFines: filteredFines.length,
      totalAmount,
      paidFines: paidFines.length,
      paidAmount,
      assignedFines: assignedFines.length,
      disputedFines: disputedFines.length,
      averageFineAmount: totalAmount / filteredFines.length,
      pendingAmount
    };
  }, [filteredFines]);

  // Prepare chart data
  const prepareChartData = () => {
    // Status distribution data for pie chart
    const statusDistribution = [
      { name: 'Paid', value: 0, count: 0 },
      { name: 'Pending', value: 0, count: 0 },
      { name: 'Disputed', value: 0, count: 0 }
    ];
    
    // Monthly trend data for line/bar chart
    const monthlyData: Record<string, { month: string, count: number, amount: number }> = {};
    
    // Location data
    const locationData: Record<string, { location: string, count: number, amount: number }> = {};
    
    if (filteredFines && filteredFines.length > 0) {
      // Process status distribution
      filteredFines.forEach(fine => {
        if (fine.paymentStatus === 'paid') {
          statusDistribution[0].value += fine.fineAmount;
          statusDistribution[0].count += 1;
        } else if (fine.paymentStatus === 'disputed') {
          statusDistribution[2].value += fine.fineAmount;
          statusDistribution[2].count += 1;
        } else {
          statusDistribution[1].value += fine.fineAmount;
          statusDistribution[1].count += 1;
        }
        
        // Process monthly data
        const date = new Date(fine.violationDate);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: monthName,
            count: 0,
            amount: 0
          };
        }
        
        monthlyData[monthYear].count += 1;
        monthlyData[monthYear].amount += fine.fineAmount;
        
        // Process location data
        if (fine.location) {
          if (!locationData[fine.location]) {
            locationData[fine.location] = {
              location: fine.location,
              count: 0,
              amount: 0
            };
          }
          
          locationData[fine.location].count += 1;
          locationData[fine.location].amount += fine.fineAmount;
        }
      });
    }
    
    // Convert to arrays and sort
    const monthlyDataArray = Object.values(monthlyData).sort((a, b) => {
      // Extract year and month from the month string (e.g., "Jan '23")
      const [aMonth, aYear] = a.month.split(" ");
      const [bMonth, bYear] = b.month.split(" ");
      
      // Compare years first
      if (aYear !== bYear) return aYear.localeCompare(bYear);
      
      // Then compare months
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
    
    const locationDataArray = Object.values(locationData)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 locations
    
    return {
      statusDistribution,
      monthlyData: monthlyDataArray,
      locationData: locationDataArray
    };
  };
  
  const { statusDistribution, monthlyData, locationData } = prepareChartData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Traffic Fine Analytics</h2>
          <p className="text-muted-foreground">Comprehensive analysis of traffic violations and payments</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last 30 days</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends & Distributions</TabsTrigger>
          <TabsTrigger value="location">Location Analysis</TabsTrigger>
          <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Traffic Fines"
              value={summaryMetrics.totalFines.toString()}
              description={`Total amount: ${formatCurrency(summaryMetrics.totalAmount)}`}
              icon={AlertTriangle}
              iconColor="text-amber-500"
            />
            <StatCard
              title="Paid Fines"
              value={summaryMetrics.paidFines.toString()}
              description={`Amount paid: ${formatCurrency(summaryMetrics.paidAmount)}`}
              icon={CheckCircle}
              iconColor="text-green-500"
              trend={summaryMetrics.totalFines ? Math.round((summaryMetrics.paidFines / summaryMetrics.totalFines) * 100) : 0}
              trendLabel="of total fines"
            />
            <StatCard
              title="Assigned Fines"
              value={summaryMetrics.assignedFines.toString()}
              description={`${summaryMetrics.totalFines ? Math.round((summaryMetrics.assignedFines / summaryMetrics.totalFines) * 100) : 0}% assignment rate`}
              icon={Users}
              iconColor="text-blue-500"
            />
            <StatCard
              title="Pending Amount"
              value={formatCurrency(summaryMetrics.pendingAmount)}
              description={`From ${summaryMetrics.totalFines - summaryMetrics.paidFines - summaryMetrics.disputedFines} unpaid fines`}
              icon={DollarSign}
              iconColor="text-red-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Distribution</CardTitle>
                <CardDescription>Breakdown of fine amounts by payment status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ChartContainer
                  config={{
                    Paid: { label: "Paid", color: "#22c55e" },
                    Pending: { label: "Pending", color: "#f59e0b" },
                    Disputed: { label: "Disputed", color: "#ef4444" }
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value: any) => formatCurrency(value as number)}
                        />} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>Number of fines over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [value, 'Count']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="count" fill="#8884d8" name="Number of Fines" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fine Amounts Over Time</CardTitle>
                <CardDescription>Total fine amount by month</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Amount']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} name="Fine Amount" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fine Count vs Amount</CardTitle>
                <CardDescription>Correlation between number of fines and total amount</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: any, name: any) => {
                        return name === 'Amount' ? [formatCurrency(value), name] : [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Count" />
                    <Bar yAxisId="right" dataKey="amount" fill="#82ca9d" name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Violation Locations</CardTitle>
              <CardDescription>Areas with the highest number of traffic fines</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="location" type="category" width={150} />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Count']}
                    labelFormatter={(label) => `Location: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Number of Fines" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Fine Amount by Location</CardTitle>
              <CardDescription>Total fine amounts across different locations</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="location" type="category" width={150} />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Amount']}
                    labelFormatter={(label) => `Location: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#82ca9d" name="Fine Amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data-quality" className="space-y-6">
          {isRunningHealthCheck ? (
            <Card>
              <CardContent className="p-6 flex justify-center items-center">
                <div className="flex flex-col items-center space-y-4">
                  <Clock className="h-12 w-12 animate-spin text-primary" />
                  <p>Running data quality health check...</p>
                </div>
              </CardContent>
            </Card>
          ) : healthCheckData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Data Quality Score"
                  value={healthCheckData.status === 'success' ? 'Good' : healthCheckData.status === 'warning' ? 'Fair' : 'Poor'}
                  description={`${healthCheckData.issues.length} issues detected`}
                  icon={AlertCircle}
                  iconColor={healthCheckData.status === 'success' ? 'text-green-500' : healthCheckData.status === 'warning' ? 'text-amber-500' : 'text-red-500'}
                />
                <StatCard
                  title="Total Violations"
                  value={healthCheckData.metrics.totalFines.toString()}
                  description="Records in database"
                  icon={AlertTriangle}
                  iconColor="text-amber-500"
                />
                <StatCard
                  title="Unassigned Fines"
                  value={healthCheckData.metrics.unassignedFines.toString()}
                  description={`${((healthCheckData.metrics.unassignedFines / healthCheckData.metrics.totalFines) * 100).toFixed(1)}% of total`}
                  icon={Users}
                  iconColor="text-blue-500"
                />
                <StatCard
                  title="Missing Data"
                  value={`${((healthCheckData.issues.length / healthCheckData.metrics.totalFines) * 100).toFixed(1)}%`}
                  description="Records with issues"
                  icon={AlertCircle}
                  iconColor="text-red-500"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Data Quality Issues</CardTitle>
                  <CardDescription>Identified problems in the traffic fines data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthCheckData.issues.length > 0 ? (
                      healthCheckData.issues.map((issue: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2 p-2 border rounded bg-amber-50">
                          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800">{issue}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start space-x-2 p-2 border rounded bg-green-50">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">No data quality issues detected.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-primary" />
                  <p>Data quality analysis not yet performed.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficFineAnalytics;
