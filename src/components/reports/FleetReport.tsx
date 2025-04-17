import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { Vehicle } from '@/types/vehicle';
import { formatCurrency } from '@/lib/utils';
import { VehicleTypeDistribution, FleetStats } from '@/types/fleet-report';

const FleetReport = () => {
  const {
    vehicles,
    fleetStats,
    vehiclesByType,
    isLoading,
    error,
    rentals,
    maintenanceExpenses
  } = useFleetReport();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading fleet data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading fleet data: {error.message}</div>;
  }

  const totalMaintenanceCost = maintenanceExpenses.reduce((sum, expense) => sum + expense.cost, 0);

  const renderVehicleRow = (vehicle: Vehicle) => {
    const isRented = vehicle.status === 'rented';
    
    // Find the customer information from rentals if available
    const rentalInfo = rentals.find(rental => rental.vehicleId === vehicle.id);
    const customerName = rentalInfo ? rentalInfo.customerName : 'N/A';
    
    return (
      <TableRow key={vehicle.id}>
        <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
        <TableCell>{vehicle.license_plate}</TableCell>
        <TableCell>{vehicle.year}</TableCell>
        <TableCell>{vehicle.status}</TableCell>
        
        {/* Update these lines */}
        <TableCell>{isRented ? customerName : 'N/A'}</TableCell>
        <TableCell>{isRented ? rentalInfo?.customerPhone || 'N/A' : 'N/A'}</TableCell>
        
        <TableCell>{formatCurrency(vehicle.rent_amount || 0)}</TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <h2 className="text-xl font-bold">Fleet Analytics Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.availableCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicles in Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.maintenanceCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rented Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.rentedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Avg. Daily Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclesByType.map((item: VehicleTypeDistribution) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>{formatCurrency(item.avgDailyRate || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Total: {formatCurrency(totalMaintenanceCost)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Customer Phone</TableHead>
                  <TableHead>Rent Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map(vehicle => renderVehicleRow(vehicle))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetReport;
