
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, Car } from 'lucide-react';
import { Vehicle, VehicleStatus } from '@/types/vehicle';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface VehicleTableViewProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onSelectVehicle: (id: string) => void;
}

const getStatusBadge = (status: VehicleStatus) => {
  switch (status) {
    case 'available':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Available</Badge>;
    case 'rented':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Rented</Badge>;
    case 'reserved':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Reserved</Badge>;
    case 'maintenance':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Maintenance</Badge>;
    case 'stolen':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Stolen</Badge>;
    case 'police_station':
      return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Police Station</Badge>;
    case 'accident':
      return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200">Accident</Badge>;
    case 'retired':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Retired</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const VehicleTableView: React.FC<VehicleTableViewProps> = ({ 
  vehicles, 
  isLoading, 
  onSelectVehicle 
}) => {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Make</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>License Plate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!vehicles.length) {
    return (
      <div className="bg-muted/50 border border-border text-muted-foreground p-8 rounded-md text-center">
        <Car className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
        <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
        <p>No vehicles match your current criteria.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Make</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Mileage</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map(vehicle => (
            <TableRow key={vehicle.id} onClick={() => onSelectVehicle(vehicle.id)} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">{vehicle.make}</TableCell>
              <TableCell>{vehicle.model}</TableCell>
              <TableCell>{vehicle.year}</TableCell>
              <TableCell>{vehicle.license_plate}</TableCell>
              <TableCell>{getStatusBadge(vehicle.status || 'available')}</TableCell>
              <TableCell>{vehicle.location || 'Not specified'}</TableCell>
              <TableCell>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVehicle(vehicle.id);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VehicleTableView;
