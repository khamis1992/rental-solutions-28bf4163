
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePerformanceContext } from '@/contexts/PerformanceContext';
import { BarChart, LineChart, Pie, Bar, Line, Cell, PieChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PerformanceMetric } from '@/utils/performance-monitoring';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const PerformanceDashboard: React.FC = () => {
  const { metrics, clearMetrics, isCollecting, startCollection, stopCollection } = usePerformanceContext();
  const [filter, setFilter] = useState('');
  
  // Filter metrics based on search term
  const filteredMetrics = useMemo(() => {
    if (!filter) return metrics;
    return metrics.filter(metric => 
      metric.name.toLowerCase().includes(filter.toLowerCase()) ||
      (metric.metadata && JSON.stringify(metric.metadata).toLowerCase().includes(filter.toLowerCase()))
    );
  }, [metrics, filter]);
  
  // Group metrics by name
  const groupedMetrics = useMemo(() => {
    const groups: Record<string, PerformanceMetric[]> = {};
    
    filteredMetrics.forEach(metric => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric);
    });
    
    return groups;
  }, [filteredMetrics]);
  
  // Calculate statistics for each metric group
  const metricStats = useMemo(() => {
    return Object.entries(groupedMetrics).map(([name, groupMetrics]) => {
      const durations = groupMetrics.map(m => m.duration);
      const total = durations.reduce((sum, val) => sum + val, 0);
      
      return {
        name,
        count: groupMetrics.length,
        average: total / groupMetrics.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        total
      };
    }).sort((a, b) => b.average - a.average);
  }, [groupedMetrics]);
  
  // Prepare data for the summary chart
  const summaryChartData = useMemo(() => {
    return metricStats.slice(0, 10).map(stat => ({
      name: stat.name.length > 20 ? stat.name.substring(0, 20) + '...' : stat.name,
      average: Math.round(stat.average * 100) / 100
    }));
  }, [metricStats]);
  
  // Prepare data for the route timing chart
  const routeTimings = useMemo(() => {
    return Object.entries(groupedMetrics)
      .filter(([name]) => name.startsWith('route:'))
      .map(([name, metrics]) => {
        const routeName = name.replace('route:', '');
        const durations = metrics.map(m => m.duration);
        const total = durations.reduce((sum, val) => sum + val, 0);
        
        return {
          name: routeName.length > 15 ? routeName.substring(0, 15) + '...' : routeName,
          average: total / durations.length
        };
      })
      .sort((a, b) => b.average - a.average);
  }, [groupedMetrics]);
  
  // Prepare data for the component timing chart
  const componentTimings = useMemo(() => {
    return Object.entries(groupedMetrics)
      .filter(([name]) => name.startsWith('component:'))
      .map(([name, metrics]) => {
        const componentName = name.replace('component:', '').split(':')[0];
        const durations = metrics.map(m => m.duration);
        const total = durations.reduce((sum, val) => sum + val, 0);
        
        return {
          name: componentName.length > 15 ? componentName.substring(0, 15) + '...' : componentName,
          average: total / durations.length
        };
      })
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);
  }, [groupedMetrics]);
  
  // Prepare data for the API timing chart
  const apiTimings = useMemo(() => {
    return Object.entries(groupedMetrics)
      .filter(([name]) => name.startsWith('api:'))
      .map(([name, metrics]) => {
        const apiName = name.replace('api:', '');
        const durations = metrics.map(m => m.duration);
        const total = durations.reduce((sum, val) => sum + val, 0);
        
        return {
          name: apiName.length > 15 ? apiName.substring(0, 15) + '...' : apiName,
          average: total / durations.length
        };
      })
      .sort((a, b) => b.average - a.average);
  }, [groupedMetrics]);
  
  // Data for metrics type distribution
  const metricTypeDistribution = useMemo(() => {
    const types: Record<string, number> = {
      Components: 0,
      Routes: 0,
      API: 0,
      Other: 0
    };
    
    metrics.forEach(metric => {
      if (metric.name.startsWith('component:')) {
        types.Components++;
      } else if (metric.name.startsWith('route:')) {
        types.Routes++;
      } else if (metric.name.startsWith('api:')) {
        types.API++;
      } else {
        types.Other++;
      }
    });
    
    return Object.entries(types).map(([name, value]) => ({
      name,
      value
    }));
  }, [metrics]);

  // Helper function to safely format tooltip values
  const formatTooltipValue = (value: any) => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)}ms`;
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and analyze application performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          {isCollecting ? (
            <Button variant="outline" onClick={stopCollection}>
              <Pause className="mr-2 h-4 w-4" />
              Pause Collection
            </Button>
          ) : (
            <Button variant="default" onClick={startCollection}>
              <Play className="mr-2 h-4 w-4" />
              Start Collection
            </Button>
          )}
          <Button variant="outline" onClick={clearMetrics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Metrics
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Metrics</CardTitle>
            <CardDescription>Number of performance data points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Unique Metrics</CardTitle>
            <CardDescription>Unique performance measurement points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Object.keys(groupedMetrics).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Status</CardTitle>
            <CardDescription>Performance monitoring status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              {isCollecting ? (
                <>
                  <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                  Active
                </>
              ) : (
                <>
                  <span className="h-3 w-3 rounded-full bg-amber-500 mr-2"></span>
                  Paused
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-4">
        <Label htmlFor="filter">Filter Metrics</Label>
        <Input
          id="filter"
          placeholder="Search for metrics..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Metric Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metricTypeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }: any) => 
                          `${name}: ${((percent as number) * 100).toFixed(0)}%`
                        }
                      >
                        {metricTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Slowest Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summaryChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 'auto']} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value: any) => 
                        typeof value === 'number' ? [`${value.toFixed(2)}ms`, 'Average Time'] : [value, 'Average Time']
                      } />
                      <Legend />
                      <Bar dataKey="average" fill="#8884d8" name="Average Time (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Load Times</CardTitle>
              <CardDescription>Average time to load each route</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={routeTimings}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'auto']} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value: any) => 
                      typeof value === 'number' ? [`${value.toFixed(2)}ms`, 'Average Time'] : [value, 'Average Time']
                    } />
                    <Bar dataKey="average" fill="#00C49F" name="Average Load Time (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Render Times</CardTitle>
              <CardDescription>Average render time for slowest components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={componentTimings}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'auto']} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value: any) => 
                      typeof value === 'number' ? [`${value.toFixed(2)}ms`, 'Average Time'] : [value, 'Average Time']
                    } />
                    <Bar dataKey="average" fill="#FFBB28" name="Average Render Time (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {apiTimings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>API Request Times</CardTitle>
                <CardDescription>Average response time for API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={apiTimings}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 'auto']} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value: any) => 
                        typeof value === 'number' ? [`${value.toFixed(2)}ms`, 'Average Time'] : [value, 'Average Time']
                      } />
                      <Bar dataKey="average" fill="#FF8042" name="Average Response Time (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="raw-data">
          <Card>
            <CardHeader>
              <CardTitle>Raw Performance Data</CardTitle>
              <CardDescription>View detailed metrics for each component and route</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg (ms)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min (ms)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metricStats.map((stat, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.average.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.min.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.max.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;
