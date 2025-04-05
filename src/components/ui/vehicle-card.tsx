
import React from 'react';
import { Card, CardContent, CardFooter } from './card';
import { Badge } from './badge';
import { Vehicle } from '@/types/vehicle';
import { formatCurrency } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  className?: string;
  onClick?: () => void;
}

export const VehicleCard = ({ vehicle, className, onClick }: VehicleCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'rented':
        return <Badge variant="default">Rented</Badge>;
      case 'reserved':
      case 'reserve':
        return <Badge variant="warning">Reserved</Badge>;
      case 'maintenance':
        return <Badge variant="outline">Maintenance</Badge>;
      case 'police_station':
        return <Badge variant="destructive">Police Station</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card 
      className={`overflow-hidden cursor-pointer hover:border-primary transition-colors ${className || ''}`}
      onClick={onClick}
    >
      <div className="aspect-video w-full bg-muted relative">
        {vehicle.image_url ? (
          <img 
            src={vehicle.image_url} 
            alt={`${vehicle.make} ${vehicle.model}`} 
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
            No Image
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getStatusBadge(vehicle.status || 'unknown')}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
        <p className="text-muted-foreground">{vehicle.year} • {vehicle.license_plate}</p>
        {vehicle.vehicleType && (
          <p className="text-sm font-medium mt-1">{vehicle.vehicleType.name}</p>
        )}
      </CardContent>
      <CardFooter className="pt-0 px-4 pb-4">
        <p className="text-sm font-medium text-primary">
          {formatCurrency(vehicle.dailyRate || vehicle.rent_amount || 0)} / day
        </p>
      </CardFooter>
    </Card>
  );
};
