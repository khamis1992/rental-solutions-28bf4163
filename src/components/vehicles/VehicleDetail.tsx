
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/types/vehicle';
import { Calendar, MapPin, Fuel, Activity, Key, CreditCard, Car, Palette, Settings, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface VehicleDetailProps {
  vehicle: Vehicle;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle }) => {
  // Status colors mapping
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-amber-100 text-amber-800',
    retired: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="w-full overflow-hidden card-transition">
      <div className="relative h-56 md:h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
        <img 
          src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop'} 
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{vehicle.make} {vehicle.model}</h1>
            <Badge className={cn(statusColors[vehicle.status])}>
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center mt-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{vehicle.year}</span>
            <span className="mx-2">•</span>
            <span className="font-medium">{vehicle.licensePlate}</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <CardTitle className="mb-4 text-lg">Vehicle Details</CardTitle>
            <ul className="space-y-3">
              <li className="flex items-center text-sm">
                <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">VIN:</span>
                <span>{vehicle.vin || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Location:</span>
                <span>{vehicle.location || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Fuel Level:</span>
                <span>{vehicle.fuelLevel !== undefined ? `${vehicle.fuelLevel}%` : 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Mileage:</span>
                <span>
                  {vehicle.mileage !== undefined && vehicle.mileage !== null 
                    ? `${vehicle.mileage.toLocaleString()} km` 
                    : 'N/A'}
                </span>
              </li>
              <li className="flex items-center text-sm">
                <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Color:</span>
                <span>{vehicle.color || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Category:</span>
                <span className="capitalize">{vehicle.category || 'N/A'}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <CardTitle className="mb-4 text-lg">Additional Information</CardTitle>
            <ul className="space-y-3">
              <li className="flex items-center text-sm">
                <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Transmission:</span>
                <span className="capitalize">{vehicle.transmission || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Fuel Type:</span>
                <span className="capitalize">{vehicle.fuelType || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Daily Rate:</span>
                <span>{vehicle.dailyRate ? `$${vehicle.dailyRate.toFixed(2)}` : 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Last Serviced:</span>
                <span>
                  {vehicle.lastServiced ? format(new Date(vehicle.lastServiced), 'MMM d, yyyy') : 'N/A'}
                </span>
              </li>
              <li className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Next Service:</span>
                <span>
                  {vehicle.nextServiceDue ? format(new Date(vehicle.nextServiceDue), 'MMM d, yyyy') : 'N/A'}
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        {vehicle.features && vehicle.features.length > 0 && (
          <div className="mt-6">
            <CardTitle className="mb-4 text-lg">Features</CardTitle>
            <div className="flex flex-wrap gap-2">
              {vehicle.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="rounded-md">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {vehicle.notes && (
          <div className="mt-6">
            <CardTitle className="mb-4 text-lg">Notes</CardTitle>
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                <p>{vehicle.notes}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

