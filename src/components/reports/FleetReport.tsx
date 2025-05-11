
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, CircleDollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define proper structure for ReportData to include vehicles and report
type ReportData = {
  vehicles: any[];
  report: {
    totalVehicles: number;
    rentedVehicles: number;
    maintenanceVehicles: number;
    averageRentAmount: number;
    vehiclesByType: Record<string, number>;
  };
};

const FleetReport = () => {
  const { 
    reportData, 
    loading: isLoading,
    error
  } = useFleetReport();
  
  // Extract vehicles and report from the reportData
  const vehicles = reportData?.vehicles || [];
  const report = reportData?.report || {
    totalVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    averageRentAmount: 0,
    vehiclesByType: {}
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-7 w-48 bg-gray-100 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-100 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading fleet data</p>
            <p className="text-sm mt-2">{String(error)}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Extract stats from report
  const fleetStats = {
    totalVehicles: report.totalVehicles,
    activeRentals: report.rentedVehicles,
    averageDailyRate: report.averageRentAmount,
    maintenanceRequired: report.maintenanceVehicles
  };

  // Create vehicle type data for the chart
  const vehiclesByTypeData = Object.entries(report.vehiclesByType || {}).map(([type, count]) => {
    // Filter vehicles of this type to calculate average rate
    const vehiclesOfType = vehicles.filter(v => v && v.vehicle_type === type);
    const totalRate = vehiclesOfType.reduce((sum, v) => sum + (v?.rent_amount || 0), 0);
    const avgRate = vehiclesOfType.length > 0 ? totalRate / vehiclesOfType.length : 0;
    
    return {
      type,
      count,
      avgDailyRate: avgRate
    };
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Vehicles" 
          value={fleetStats.totalVehicles.toString()} 
          trend={5} // This would come from comparing with previous period
          trendLabel="vs last month"
          icon={Car}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Active Rentals" 
          value={fleetStats.activeRentals.toString()} 
          trend={12} // This would come from comparing with previous period
          trendLabel="vs last month"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Average Daily Rate" 
          value={formatCurrency(fleetStats.averageDailyRate)} 
          trend={3} // This would come from comparing with previous period
          trendLabel="vs last month"
          icon={CircleDollarSign}
          iconColor="text-indigo-500"
        />
        <StatCard 
          title="Maintenance Required" 
          value={fleetStats.maintenanceRequired.toString()} 
          trend={-2} // This would come from comparing with previous period
          trendLabel="vs last month"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Customer</TableHead>
                  <TableHead className="text-right">Daily Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.slice(0, 5).map((vehicle) => {
                  if (!vehicle) return null; // Skip null vehicles
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
                      <TableCell>{vehicle.license_plate}</TableCell>
                      <TableCell>
                        <StatusBadge status={vehicle.status || 'available'} />
                      </TableCell>
                      <TableCell>
                        {vehicle.status === 'rented' && vehicle.currentCustomer ? 
                          vehicle.currentCustomer : 
                          <span className="text-muted-foreground italic">Not assigned</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(vehicle.rent_amount || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>No vehicle data available</p>
              <p className="text-sm mt-2">Vehicle data will appear here when available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Performance by Vehicle Type</CardTitle>
        </CardHeader>
        <CardContent>
          {vehiclesByTypeData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vehiclesByTypeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    tick={{ 
                      transform: 'rotate(-45)',
                      textAnchor: 'end',
                      dominantBaseline: 'auto'
                    }}
                    height={70}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#82ca9d"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'avgDailyRate') {
                      return [formatCurrency(Number(value)), 'Avg Daily Rate'];
                    }
                    return [value, name === 'count' ? 'Count' : name];
                  }} />
                  <Bar dataKey="count" fill="#8884d8" yAxisId="left" name="Vehicle Count" />
                  <Bar dataKey="avgDailyRate" fill="#82ca9d" yAxisId="right" name="Avg Daily Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>No performance data available</p>
              <p className="text-sm mt-2">Performance data will appear here when available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'available': 'bg-green-100 text-green-800',
    'rented': 'bg-blue-100 text-blue-800',
    'maintenance': 'bg-amber-100 text-amber-800',
    'repair': 'bg-red-100 text-red-800',
    'reserved': 'bg-purple-100 text-purple-800',
  };

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );
};

export default FleetReport;
