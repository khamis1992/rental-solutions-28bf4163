
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, CircleDollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

const FleetReport = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Vehicles" 
          value="124" 
          trend={5}
          trendLabel="vs last month"
          icon={Car}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Active Rentals" 
          value="83" 
          trend={12}
          trendLabel="vs last month"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Average Daily Rate" 
          value={formatCurrency(85)} 
          trend={3}
          trendLabel="vs last month"
          icon={CircleDollarSign}
          iconColor="text-indigo-500"
        />
        <StatCard 
          title="Maintenance Required" 
          value="7" 
          trend={-2}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Utilization Rate</TableHead>
                <TableHead>Revenue Generated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVehicleData.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>
                    <StatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell>{vehicle.utilizationRate}%</TableCell>
                  <TableCell>{formatCurrency(vehicle.revenueGenerated)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Performance by Vehicle Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Avg. Daily Rate</TableHead>
                <TableHead>Avg. Utilization</TableHead>
                <TableHead>Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTypePerformance.map((type) => (
                <TableRow key={type.type}>
                  <TableCell className="font-medium">{type.type}</TableCell>
                  <TableCell>{type.count}</TableCell>
                  <TableCell>{formatCurrency(type.avgDailyRate)}</TableCell>
                  <TableCell>{type.avgUtilization}%</TableCell>
                  <TableCell>{formatCurrency(type.totalRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
  };

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );
};

const mockVehicleData = [
  { id: 1, make: 'Toyota', model: 'Camry', licensePlate: 'ABC123', status: 'rented', utilizationRate: 87, revenueGenerated: 3250 },
  { id: 2, make: 'Honda', model: 'Civic', licensePlate: 'XYZ789', status: 'available', utilizationRate: 72, revenueGenerated: 2840 },
  { id: 3, make: 'Nissan', model: 'Altima', licensePlate: 'DEF456', status: 'rented', utilizationRate: 91, revenueGenerated: 3620 },
  { id: 4, make: 'Ford', model: 'Escape', licensePlate: 'GHI789', status: 'maintenance', utilizationRate: 64, revenueGenerated: 2180 },
  { id: 5, make: 'BMW', model: '3 Series', licensePlate: 'JKL012', status: 'rented', utilizationRate: 89, revenueGenerated: 5120 },
];

const mockTypePerformance = [
  { type: 'Sedan', count: 42, avgDailyRate: 75, avgUtilization: 82, totalRevenue: 94500 },
  { type: 'SUV', count: 28, avgDailyRate: 95, avgUtilization: 78, totalRevenue: 78200 },
  { type: 'Luxury', count: 15, avgDailyRate: 150, avgUtilization: 68, totalRevenue: 45900 },
  { type: 'Economy', count: 35, avgDailyRate: 60, avgUtilization: 91, totalRevenue: 67300 },
];

export default FleetReport;
