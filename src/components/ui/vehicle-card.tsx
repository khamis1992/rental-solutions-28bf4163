import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Car, MapPin, AlertTriangle } from 'lucide-react';

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year?: number;
  licensePlate: string;
  status: string;
  imageUrl?: string;
  location?: string;
  fuelLevel?: number;
  mileage?: number;
  onSelect: (id: string) => void;
}

export const VehicleCard = React.memo(function VehicleCard({ 
  id, 
  make, 
  model, 
  year, 
  licensePlate, 
  status, 
  imageUrl, 
  location, 
  fuelLevel, 
  mileage, 
  onSelect 
}: VehicleCardProps) {
  return (
    <Card className="overflow-hidden border border-border/60 rounded-lg hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={imageUrl}
          alt={`${make} ${model}`}
          className="aspect-video w-full object-cover"
          onError={(e: any) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-image.jpg';
          }}
        />
        <Badge
          className={cn(
            "absolute top-2 left-2 uppercase text-xs font-bold",
            status === 'available' ? 'bg-green-500 text-white' :
            status === 'rented' ? 'bg-blue-500 text-white' :
            status === 'reserved' ? 'bg-yellow-500 text-black' :
            status === 'maintenance' ? 'bg-orange-500 text-white' :
            status === 'police_station' ? 'bg-red-500 text-white' :
            status === 'accident' ? 'bg-red-500 text-white' :
            status === 'stolen' ? 'bg-red-500 text-white' :
            'bg-gray-500 text-white'
          )}
        >
          {status.replace('_', ' ')}
        </Badge>
      </div>
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold">{make} {model}</h3>
        <p className="text-sm text-muted-foreground">{year || 'Year N/A'}</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Car className="h-4 w-4 mr-1" />
            {licensePlate}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            {location ? (
              <>
                <MapPin className="h-4 w-4 mr-1" />
                {location}
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                Location N/A
              </>
            )}
          </div>
        </div>
      </CardContent>
      <div className="px-5 pb-5 pt-0">
        <button
          onClick={() => onSelect(id)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary/50 h-10 px-4 py-2 w-full bg-accent text-accent-foreground"
        >
          View Details
        </button>
      </div>
    </Card>
  );
});
