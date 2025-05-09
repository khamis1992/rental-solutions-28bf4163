
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Vehicle } from '@/types/vehicle';

interface VehicleTableProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles = [],
  isLoading,
  onRowClick,
}) => {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Daily Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(5).fill(0).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (!vehicles.length) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No vehicles found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Daily Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow
              key={vehicle.id}
              onClick={() => onRowClick(vehicle.id)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
              <TableCell>{vehicle.year}</TableCell>
              <TableCell>{vehicle.license_plate}</TableCell>
              <TableCell>
                <VehicleStatusBadge status={vehicle.status} />
              </TableCell>
              <TableCell>{vehicle.vehicleType?.name || 'Standard'}</TableCell>
              <TableCell>
                {vehicle.dailyRate ? formatCurrency(vehicle.dailyRate) : 
                 vehicle.rent_amount ? formatCurrency(vehicle.rent_amount) : 'Not set'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VehicleTable;
