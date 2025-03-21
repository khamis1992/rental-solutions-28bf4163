
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleUser, Calendar, MapPin, Fuel, Activity } from 'lucide-react';
import { CustomButton } from './custom-button';
import { VehicleStatus } from '@/types/vehicle';

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  imageUrl: string;
  location?: string;
  fuelLevel?: number;
  mileage?: number | null;
  className?: string;
  onSelect?: (id: string) => void;
}

const VehicleCard = ({
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
  className,
  onSelect,
}: VehicleCardProps) => {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-amber-100 text-amber-800',
    retired: 'bg-gray-100 text-gray-800'
  };

  // Default image for cars
  const defaultCarImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop';
  
  // Custom image logic by make/model
  // We're using public folder images to ensure they load properly
  let displayImageUrl = '';
  
  try {
    // Try to determine vehicle type for custom image
    const makeLower = (make || '').toString().toLowerCase();
    const modelLower = (model || '').toString().toLowerCase();
    
    console.log('Vehicle make/model:', makeLower, modelLower);
    
    if (makeLower.includes('mg')) {
      displayImageUrl = '/lovable-uploads/24b2beed-65f3-42be-a4ad-c24610112f5d.png'; // Use the new uploaded image
      console.log('Using custom MG image');
    } else if (modelLower.includes('t77')) {
      displayImageUrl = '/lovable-uploads/24b2beed-65f3-42be-a4ad-c24610112f5d.png'; // Same image for T77
      console.log('Using custom T77 image');
    } else if (imageUrl) {
      displayImageUrl = imageUrl;
    } else {
      displayImageUrl = defaultCarImage;
    }
  } catch (error) {
    console.error('Error setting vehicle image:', error);
    displayImageUrl = defaultCarImage;
  }

  return (
    <Card className={cn(
      "overflow-hidden border border-border/60 transition-all duration-300 hover:shadow-card", 
      "card-transition", 
      className
    )}>
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
        <img 
          src={displayImageUrl} 
          alt={`${make} ${model}`}
          className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105"
          onError={(e) => {
            console.log('Image failed to load, using fallback:', e.currentTarget.src);
            // Fallback to default image if loading fails
            e.currentTarget.src = defaultCarImage;
          }}
        />
        <Badge className={cn("absolute top-3 right-3 z-20", statusColors[status])}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{make} {model}</h3>
            <div className="flex items-center mt-1 text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm">{year}</span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-sm font-medium">{licensePlate}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {location && (
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 mr-1.5" />
              <span className="truncate">{location}</span>
            </div>
          )}
          
          {fuelLevel !== undefined && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Fuel className="h-4 w-4 mr-1.5" />
              <span>{fuelLevel}%</span>
            </div>
          )}
          
          {mileage !== undefined && mileage !== null && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Activity className="h-4 w-4 mr-1.5" />
              <span>{mileage.toLocaleString()} km</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0">
        <CustomButton 
          className="w-full" 
          glossy={true}
          onClick={() => onSelect && onSelect(id)}
        >
          View Details
        </CustomButton>
      </CardFooter>
    </Card>
  );
};

export { VehicleCard };
