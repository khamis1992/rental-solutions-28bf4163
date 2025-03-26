
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wrench, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useMaintenance } from '@/hooks/use-maintenance';

const MaintenanceReport = () => {
  const { useList } = useMaintenance();
  const { data: maintenanceRecords = [], isLoading } = useList();

  // Calculate maintenance metrics
  const totalMaintenance = maintenanceRecords.length;
  const pendingMaintenance = maintenanceRecords.filter(record => 
    record.status === 'scheduled' || record.status === 'in_progress'
  ).length;
  
  // Calculate average resolution time (in days)
  const completedMaintenance = maintenanceRecords.filter(record => record.status === 'completed');
  const avgResolutionTime = completedMaintenance.length > 0 
    ? completedMaintenance.reduce((total, record) => {
        const scheduleDate = new Date(record.scheduled_date);
        const completionDate = record.completion_date ? new Date(record.completion_date) : new Date();
        const diffTime = Math.abs(completionDate.getTime() - scheduleDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return total + diffDays;
      }, 0) / completedMaintenance.length
    : 0;
  
  // Calculate total maintenance costs
  const totalCosts = maintenanceRecords.reduce((total, record) => {
    return total + (record.cost || 0);
  }, 0);

  // Group by maintenance type
  const maintenanceByType = maintenanceRecords.reduce((acc, record) => {
    const type = record.maintenance_type || 'Other';
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type]++;
    return acc;
  }, {});

  const maintenanceByTypeData = Object.keys(maintenanceByType).map(type => ({
    type,
    count: maintenanceByType[type]
  })).sort((a, b) => b.count - a.count);

  // Get recent maintenance for the table
  const recentMaintenanceData = maintenanceRecords
    .slice(0, 5)
    .map(record => ({
      id: record.id,
      date: record.scheduled_date ? new Date(record.scheduled_date).toISOString().split('T')[0] : 'N/A',
      vehicle: record.vehicles ? `${record.vehicles.make} ${record.vehicles.model} (${record.vehicles.license_plate})` : 'Unknown Vehicle',
      type: record.maintenance_type || 'General Maintenance',
      status: record.status || 'scheduled',
      technician: record.performed_by ? record.performed_by : 'Not assigned',
      cost: record.cost || 0
    }));

  // Calculate maintenance cost by vehicle
  const costByVehicle = maintenanceRecords.reduce((acc, record) => {
    if (!record.vehicle_id || !record.vehicles) return acc;
    
    const vehicleName = `${record.vehicles.make} ${record.vehicles.model}`;
    if (!acc[vehicleName]) {
      acc[vehicleName] = 0;
    }
    acc[vehicleName] += (record.cost || 0);
    return acc;
  }, {});

  const maintenanceCostByVehicleData = Object.keys(costByVehicle).map(vehicle => ({
    vehicle,
    cost: costByVehicle[vehicle]
  })).sort((a, b) => b.cost - a.cost).slice(0, 6);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading maintenance data...</div>;
  }

  // Show empty state when no data is available
  if (maintenanceRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Wrench className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No maintenance records found</h3>
        <p className="text-sm text-gray-500 mt-2">Add maintenance records to see analytics and reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Maintenance" 
          value={totalMaintenance.toString()} 
          icon={Wrench}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Pending Maintenance" 
          value={pendingMaintenance.toString()} 
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <StatCard 
          title="Avg Resolution Time" 
          value={`${avgResolutionTime.toFixed(1)} days`} 
          icon={Clock}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Maintenance Costs" 
          value={formatCurrency(totalCosts)} 
          icon={DollarSign}
          iconColor="text-red-500"
        />
      </div>

      {maintenanceByTypeData.length > 0 && (
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
      )}

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
              {recentMaintenanceData.length > 0 ? (
                recentMaintenanceData.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell>{maintenance.date}</TableCell>
                    <TableCell className="font-medium">{maintenance.vehicle}</TableCell>
                    <TableCell>{maintenance.type}</TableCell>
                    <TableCell>
                      <MaintenanceStatusBadge status={maintenance.status} />
                    </TableCell>
                    <TableCell>{maintenance.technician}</TableCell>
                    <TableCell className="text-right">{formatCurrency(maintenance.cost)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No maintenance records available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {maintenanceCostByVehicleData.length > 0 && (
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
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip formatter={(value, name) => {
                    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
                    return [formatCurrency(numValue), 'Maintenance Cost'];
                  }} />
                  <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const MaintenanceStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'completed': 'bg-green-100 text-green-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'scheduled': 'bg-purple-100 text-purple-800',
    'pending': 'bg-amber-100 text-amber-800',
    'cancelled': 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

export default MaintenanceReport;
