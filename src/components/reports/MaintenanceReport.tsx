
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wrench, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const MaintenanceReport = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Maintenance" 
          value="156" 
          trend={-4}
          trendLabel="vs last month"
          icon={Wrench}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Pending Maintenance" 
          value="7" 
          trend={-2}
          trendLabel="vs last month"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <StatCard 
          title="Avg Resolution Time" 
          value="2.3 days" 
          trend={-0.5}
          trendLabel="vs last month"
          icon={Clock}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Maintenance Costs" 
          value="$34,850" 
          trend={6}
          trendLabel="vs last month"
          icon={DollarSign}
          iconColor="text-red-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={maintenanceByTypeData}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="type" 
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={150}
                />
                <Tooltip formatter={(value) => [`${value} incidents`, 'Count']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMaintenanceData.map((maintenance) => (
                <TableRow key={maintenance.id}>
                  <TableCell>{maintenance.date}</TableCell>
                  <TableCell className="font-medium">{maintenance.vehicle}</TableCell>
                  <TableCell>{maintenance.type}</TableCell>
                  <TableCell>
                    <MaintenanceStatusBadge status={maintenance.status} />
                  </TableCell>
                  <TableCell>{maintenance.technician}</TableCell>
                  <TableCell className="text-right">${maintenance.cost.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Cost by Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={maintenanceCostByVehicleData}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="vehicle" 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Maintenance Cost']} />
                <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MaintenanceStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'completed': 'bg-green-100 text-green-800',
    'in progress': 'bg-blue-100 text-blue-800',
    'scheduled': 'bg-purple-100 text-purple-800',
    'pending': 'bg-amber-100 text-amber-800',
  };

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );
};

const maintenanceByTypeData = [
  { type: 'Regular Service', count: 62 },
  { type: 'Tire Replacement', count: 38 },
  { type: 'Oil Change', count: 47 },
  { type: 'Battery Replacement', count: 15 },
  { type: 'Brake Service', count: 28 },
  { type: 'Engine Repair', count: 8 },
  { type: 'Air Conditioning', count: 12 },
];

const recentMaintenanceData = [
  { id: 1, date: '2023-08-14', vehicle: 'Toyota Camry (ABC123)', type: 'Oil Change', status: 'completed', technician: 'John Doe', cost: 95 },
  { id: 2, date: '2023-08-13', vehicle: 'Honda Civic (XYZ789)', type: 'Tire Replacement', status: 'completed', technician: 'Mike Smith', cost: 420 },
  { id: 3, date: '2023-08-12', vehicle: 'Ford Escape (GHI789)', type: 'Engine Repair', status: 'in progress', technician: 'Sarah Johnson', cost: 850 },
  { id: 4, date: '2023-08-10', vehicle: 'Nissan Altima (DEF456)', type: 'Regular Service', status: 'completed', technician: 'John Doe', cost: 210 },
  { id: 5, date: '2023-08-09', vehicle: 'BMW 3 Series (JKL012)', type: 'Battery Replacement', status: 'completed', technician: 'Mike Smith', cost: 180 },
];

const maintenanceCostByVehicleData = [
  { vehicle: 'Toyota Camry', cost: 780 },
  { vehicle: 'Honda Civic', cost: 620 },
  { vehicle: 'Ford Escape', cost: 1280 },
  { vehicle: 'Nissan Altima', cost: 540 },
  { vehicle: 'BMW 3 Series', cost: 1450 },
  { vehicle: 'Audi A4', cost: 1680 },
];

export default MaintenanceReport;
