
import React from 'react';
import { Button } from '@/components/ui/button';
import { Car, MapPin, MoreHorizontal, Gauge, Edit, RefreshCw } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  imageUrl?: string;
  location?: string;
  fuelLevel?: number;
  mileage?: number;
  currentCustomer?: string;
  onSelect?: () => void;
  onStatusUpdate?: () => void;
}

const getStatusColor = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return 'bg-green-500';
    case 'rented': return 'bg-blue-500';
    case 'reserved': return 'bg-amber-500';
    case 'maintenance': return 'bg-red-500';
    case 'police_station': return 'bg-indigo-500';
    case 'accident': return 'bg-rose-500';
    case 'stolen': return 'bg-purple-500';
    case 'retired': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

const getStatusLabel = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return 'Available';
    case 'rented': return 'Rented';
    case 'reserved': return 'Reserved';
    case 'maintenance': return 'Maintenance';
    case 'police_station': return 'Police Station';
    case 'accident': return 'Accident';
    case 'stolen': return 'Stolen';
    case 'retired': return 'Retired';
    default: return 'Unknown';
  }
};

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

export const VehicleCard = ({
  id,
  make,
  model,
  year,
  licensePlate,
  status,
  imageUrl,
  location = 'Not specified',
  fuelLevel,
  mileage,
  currentCustomer,
  onSelect,
  onStatusUpdate
}: VehicleCardProps) => {
  const handleCardClick = () => {
    if (onSelect) onSelect();
  };

  const statusColor = getStatusColor(status);

  return (
    <div 
      className={cn(
        "overflow-hidden rounded-lg border border-border/60 bg-card",
        "transition-all duration-200 hover:shadow-md relative",
        "flex flex-col h-full"
      )}
    >
      <div 
        className={`absolute top-0 left-0 w-1 h-full ${statusColor}`} 
        title={getStatusLabel(status)}
      />
      
      <div className="relative h-48 overflow-hidden bg-muted/30">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${make} ${model}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <Car className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getStatusBadge(status)}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight mb-1 hover:text-primary cursor-pointer" onClick={handleCardClick}>
              {make} {model}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCardClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {onStatusUpdate && (
                  <DropdownMenuItem onClick={onStatusUpdate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Status
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">{year} • {licensePlate}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mt-auto">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1.5 text-muted-foreground/70" />
            <span className="truncate" title={location}>{location}</span>
          </div>
          {mileage !== undefined && (
            <div className="flex items-center">
              <Gauge className="h-4 w-4 mr-1.5 text-muted-foreground/70" />
              <span>{mileage.toLocaleString()} km</span>
            </div>
          )}
          {currentCustomer && (
            <div className="col-span-2 truncate" title={`Current Customer: ${currentCustomer}`}>
              <span className="font-medium text-foreground/80">Customer:</span> {currentCustomer}
            </div>
          )}
        </div>
      </div>
      
      <div className="px-5 pb-5 pt-0">
        <Button 
          className="w-full"
          onClick={handleCardClick}
          variant="outline"
        >
          View Details
        </Button>
      </div>
    </div>
  );
};
